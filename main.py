from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import logging
from typing import Dict, Any, List

from utils.extract_text import extract_text, extract_entities_structured_auto
from scoring import calculate_score

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CV Analyzer API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Extensions de fichiers supportées
SUPPORTED_EXTENSIONS = {'.pdf', '.doc', '.docx'}

def validate_file_type(filename: str) -> bool:
    """Valider le type de fichier"""
    if not filename:
        return False
    extension = os.path.splitext(filename)[1].lower()
    return extension in SUPPORTED_EXTENSIONS

@app.post("/analyze/", tags=["Analyse"])
async def analyze_cv(
        file: UploadFile = File(...),
        offer: str = Form(...)
) -> Dict[str, Any]:
    """Analyser un CV par rapport à une offre d'emploi"""

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant")

    if not validate_file_type(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté. Extensions acceptées: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    if not offer or not offer.strip():
        raise HTTPException(status_code=400, detail="Texte de l'offre d'emploi requis")

    os.makedirs("temp", exist_ok=True)
    temp_path = f"temp/{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Fichier sauvegardé: {temp_path}")

        cv_text = extract_text(temp_path)

        if not cv_text or not cv_text.strip():
            logger.error(f"Aucun texte extrait du fichier {file.filename}")
            raise HTTPException(
                status_code=422,
                detail="Impossible d'extraire le texte du fichier. Vérifiez que le fichier n'est pas corrompu."
            )

        logger.info(f"Texte extrait: {len(cv_text)} caractères")

        entities = extract_entities_structured_auto(cv_text)
        logger.info(f"Entités extraites: {[(k, len(v)) for k, v in entities.items()]}")

        score = calculate_score(cv_text, offer)
        logger.info(f"Score calculé: {score}")

        entites_detectees: List[Dict[str, str]] = []
        for label, values in entities.items():
            for ent in values:
                entites_detectees.append({
                    "text": str(ent),
                    "label": str(label).upper(),
                    "category": str(label)
                })

        stats: Dict[str, Any] = {
            "cv_length": len(cv_text),
            "entities_count": {str(label): len(values) for label, values in entities.items()},
            "total_entities": len(entites_detectees)
        }

        response_data: Dict[str, Any] = {
            "filename": str(file.filename),
            "score_compatibilite": float(score),
            "entites_detectees": entites_detectees,
            "langues_detectees": list(entities.get("langues", [])),
            "competences_detectees": list(entities.get("competences", [])),
            "statistics": stats,
            "status": "success"
        }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse du CV {file.filename}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Erreur interne lors de l'analyse",
                "details": str(e),
                "filename": str(file.filename),
                "status": "error"
            }
        )
    finally:
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                logger.info(f"Fichier temporaire supprimé: {temp_path}")
        except Exception as e:
            logger.warning(f"Impossible de supprimer le fichier temporaire {temp_path}: {e}")

@app.get("/health", tags=["Monitoring"])
async def health_check() -> Dict[str, Any]:
    """Point de contrôle de santé de l'API"""
    return {
        "status": "healthy",
        "supported_formats": list(SUPPORTED_EXTENSIONS),
        "message": "CV Analyzer API is running"
    }

@app.get("/", tags=["General"])
async def root() -> Dict[str, Any]:
    """Page d'accueil de l'API"""
    return {
        "message": "CV Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze/": "POST - Analyser un CV",
            "/health": "GET - Vérifier la santé de l'API",
            "/docs": "GET - Documentation Swagger"
        }
    }
