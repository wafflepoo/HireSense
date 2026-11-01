from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import logging
from typing import Dict, Any, List

from contextlib import asynccontextmanager
from .scoring import _model
from time import perf_counter
import tempfile
from pathlib import Path

from .extract_text import extract_text, extract_entities_structured_auto
from .scoring import calculate_score_detailed
from .experience_details import extract_experiences_detailed, total_experience_months

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Chargement du modèle sémantique HireSense...")
    _model()
    logger.info("Modèle sémantique prêt.")
    yield


app = FastAPI(
    title="CV Analyzer API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Extensions de fichiers supportées
SUPPORTED_EXTENSIONS = {'.pdf', '.docx'}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 Mo

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

    temp_path = None

    try:
        extension = Path(file.filename).suffix.lower()

        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=extension,
            prefix="hiresense_",
            delete=False
        ) as temp_file:
            temp_path = temp_file.name
            total_size = 0

            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Fichier trop volumineux. Maximum : 10 Mo."
                    )

                temp_file.write(chunk)

        logger.info("Fichier temporaire enregistré")

        t0 = perf_counter()
        cv_text = extract_text(temp_path)
        temps_extraction = perf_counter() - t0
        
        
        
        if not cv_text or not cv_text.strip():
            logger.error(f"Aucun texte extrait du fichier {file.filename}")
            raise HTTPException(
                status_code=422,
                detail="Impossible d'extraire le texte du fichier. Vérifiez que le fichier n'est pas corrompu."
            )

        logger.info(f"Texte extrait: {len(cv_text)} caractères")

        t0 = perf_counter()
        entities = extract_entities_structured_auto(cv_text)
        temps_entites = perf_counter() - t0
        logger.info(f"Entités extraites: {[(k, len(v)) for k, v in entities.items()]}")

        experiences_detaillees = extract_experiences_detailed(
            entities.get("experiences", [])
        )
        experience_totale_mois = total_experience_months(
            experiences_detaillees
        )

        t0 = perf_counter()
        resultat_scoring = calculate_score_detailed(
            cv_text,
            offer,
            experience_months=experience_totale_mois
        )
        score = resultat_scoring["score"]
        temps_scoring = perf_counter() - t0
        logger.info(f"Score calculé: {score}")
        
        
        logger.info(
    "Performances HireSense | Extraction: %.3fs | NLP: %.3fs | "
    "Scoring: %.3fs | Total: %.3fs",
    temps_extraction,
    temps_entites,
    temps_scoring,
    temps_extraction + temps_entites + temps_scoring
)
        

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
            "explication_score": resultat_scoring,
            "experiences_detaillees": experiences_detaillees,
            "experience_totale_mois": experience_totale_mois,
            "entites_detectees": entites_detectees,
            "langues_detectees": list(entities.get("langues", [])),
            "competences_detectees": list(entities.get("competences", [])),
            "statistics": stats,
            "status": "success"
        }

        return response_data

    except HTTPException:
        raise

    except Exception:
        logger.exception("Erreur interne lors de l'analyse du CV")
        raise HTTPException(
            status_code=500,
            detail="Une erreur interne est survenue pendant l'analyse du CV."
        )

    finally:
        await file.close()

        if temp_path is not None:
            try:
                os.remove(temp_path)
                logger.info("Fichier temporaire supprimé")
            except FileNotFoundError:
                pass
            except OSError:
                logger.exception(
                    "Impossible de supprimer le fichier temporaire"
                )


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
