import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

nlp = spacy.load("fr_core_news_md")

COMPETENCE_LIST = ["Python", "SQL", "Power BI", "Machine Learning", "Docker", "Tableau", "JavaScript", "Excel"]

def extract_competences(text):
    return [c for c in COMPETENCE_LIST if c.lower() in text.lower()]

def extract_experience_years(text):
    doc = nlp(text)
    for token in doc:
        if token.like_num:
            next_token = doc[token.i + 1] if token.i + 1 < len(doc) else None
            if next_token and next_token.text.lower() in ["an", "ans", "année", "années"]:
                try:
                    return int(token.text)
                except ValueError:
                    pass
    return 0

def compute_similarity(cv_text, job_text):
    vect = TfidfVectorizer().fit_transform([cv_text, job_text])
    return cosine_similarity(vect[0], vect[1])[0][0]

def calculate_score(cv_text: str, job_text: str) -> float:
    cv_comp = extract_competences(cv_text)
    job_comp = extract_competences(job_text)
    common_comp = set(cv_comp) & set(job_comp)
    comp_score = len(common_comp) / len(job_comp) if job_comp else 0

    cv_exp = extract_experience_years(cv_text)
    job_exp = extract_experience_years(job_text)
    exp_score = min(cv_exp / job_exp, 1.0) if job_exp > 0 else 1.0

    sim_score = compute_similarity(cv_text, job_text)

    final_score = (0.4 * comp_score + 0.3 * exp_score + 0.3 * sim_score) * 100
    return round(final_score, 2)
