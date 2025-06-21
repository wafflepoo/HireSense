import spacy
from sentence_transformers import SentenceTransformer, util
import re

nlp = spacy.load("fr_core_news_lg")
model = SentenceTransformer('distiluse-base-multilingual-cased-v1')
stop_words = nlp.Defaults.stop_words


def extract_keywords(text):
    """Extraction de mots-clés améliorée"""
    if not text or not text.strip():
        return []

    doc = nlp(text)
    keywords = []

    for token in doc:
        # Inclure plus de types de mots pour une meilleure analyse
        if (token.pos_ in ["NOUN", "VERB", "PROPN", "ADJ"] and
                token.is_alpha and
                len(token.text) > 2 and
                token.text.lower() not in stop_words):
            keywords.append(token.lemma_.lower())

    # Ajouter les entités nommées
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "PRODUCT", "WORK_OF_ART"]:
            keywords.append(ent.text.lower())

    return list(set(keywords))  # Supprimer les doublons


def extract_experience_years(text):
    """Extraction d'années d'expérience améliorée"""
    if not text:
        return 0

    # Patterns pour détecter l'expérience
    patterns = [
        r'(\d+)\s*(?:an|ans|année|années?)\s*(?:d\'|de\s*)?(?:expérience|exp)',
        r'(\d+)\s*(?:years?)\s*(?:of\s*)?(?:experience|exp)',
        r'expérience\s*(?:de\s*)?(\d+)\s*(?:an|ans|année|années?)',
        r'(\d+)\+\s*(?:an|ans|année|années?)',
    ]

    max_years = 0
    for pattern in patterns:
        matches = re.finditer(pattern, text.lower())
        for match in matches:
            try:
                years = int(match.group(1))
                max_years = max(max_years, years)
            except ValueError:
                continue

    return max_years


def compute_semantic_similarity(text1, text2):
    """Calcul de similarité sémantique"""
    if not text1 or not text2:
        return 0.0

    try:
        emb1 = model.encode(text1, convert_to_tensor=True)
        emb2 = model.encode(text2, convert_to_tensor=True)
        similarity = float(util.pytorch_cos_sim(emb1, emb2)[0][0])
        return max(0.0, similarity)  # S'assurer que la similarité n'est pas négative
    except Exception as e:
        print(f"Erreur lors du calcul de similarité: {e}")
        return 0.0


def calculate_score(cv_text: str, job_text: str) -> float:
    """Calcul de score amélioré avec gestion des cas d'erreur"""

    # Vérification des entrées
    if not cv_text or not job_text:
        print("Texte CV ou offre d'emploi vide")
        return 0.0

    if not cv_text.strip() or not job_text.strip():
        print("Texte CV ou offre d'emploi ne contient que des espaces")
        return 0.0

    # Extraction des mots-clés
    cv_keywords = extract_keywords(cv_text)
    job_keywords = extract_keywords(job_text)

    print(f"Mots-clés CV: {len(cv_keywords)} trouvés")
    print(f"Mots-clés Job: {len(job_keywords)} trouvés")

    # Si pas de mots-clés, essayer une analyse directe du texte
    if not cv_keywords or not job_keywords:
        print("Pas assez de mots-clés, analyse directe du texte")
        # Utiliser le texte complet mais limité
        cv_sample = cv_text[:1000]  # Limiter pour éviter les problèmes de performance
        job_sample = job_text[:1000]

        if cv_sample.strip() and job_sample.strip():
            sim_score = compute_semantic_similarity(cv_sample, job_sample)
            return round(max(sim_score * 100, 10.0), 2)  # Score minimum de 10
        else:
            return 0.0

    # Calcul de similarité sémantique
    cv_keywords_text = " ".join(cv_keywords)
    job_keywords_text = " ".join(job_keywords)

    sim_score = compute_semantic_similarity(cv_keywords_text, job_keywords_text)

    # Si la similarité est très faible, retourner le score basique
    if sim_score < 0.15:
        return round(max(sim_score * 100, 5.0), 2)  # Score minimum de 5

    # Calcul de l'expérience
    cv_exp = extract_experience_years(cv_text)
    job_exp = extract_experience_years(job_text)

    # Score d'expérience
    if job_exp > 0:
        exp_score = min(cv_exp / job_exp, 1.0)
    else:
        exp_score = 1.0  # Pas d'expérience requise

    # Score final pondéré
    final_score = (0.7 * sim_score + 0.3 * exp_score) * 100

    # S'assurer que le score est dans une plage raisonnable
    final_score = max(final_score, 10.0)  # Score minimum
    final_score = min(final_score, 100.0)  # Score maximum

    return round(final_score, 2)