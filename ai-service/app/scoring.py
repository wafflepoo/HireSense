"""HireSense: explainable, evidence-based CV/job matching.

The score is a document-match index, NOT a probability of hiring.
No demographic features are used. Thresholds and weights require validation.
"""
from __future__ import annotations

import re
import unicodedata
from functools import lru_cache
from typing import Any

# Canonical skill -> recognized literal aliases. Extend using a versioned taxonomy.
SKILLS = {
    "Python": ("python",), "SQL": ("sql",), "Pandas": ("pandas",),
    "Power BI": ("power bi", "powerbi"), "Excel": ("excel", "microsoft excel"),
    "Git": ("git",), "GitHub": ("github",), "GitLab CI": ("gitlab ci",),
    "Streamlit": ("streamlit",), "Docker": ("docker",),
    "Kubernetes": ("kubernetes", "k8s"), "Terraform": ("terraform",),
    "AWS": ("aws", "amazon web services"), "Azure": ("azure",),
    "GCP": ("gcp", "google cloud platform", "google cloud"),
    "Jenkins": ("jenkins",), "Linux": ("linux",),
    "Ansible": ("ansible",), "Prometheus": ("prometheus",),
    "Grafana": ("grafana",), "Helm": ("helm",),
    "CI/CD": ("ci/cd", "cicd", "integration continue", "deploiement continu"),
    "NLP": ("nlp", "traitement automatique du langage"),
    "Java": ("java",), "JavaScript": ("javascript",),
    "React": ("react", "react.js"), "Node.js": ("node.js", "nodejs"),
    "FastAPI": ("fastapi",), "PostgreSQL": ("postgresql", "postgres"),
    "MongoDB": ("mongodb",), "Spark": ("spark", "pyspark"),
    "Snowflake": ("snowflake",), "Tableau": ("tableau", "tableau software"),
    "Matplotlib": ("matplotlib",), "Seaborn": ("seaborn",),
    "Bash": ("bash",), "API REST": ("api rest", "rest api"),
    "Automatisation": ("automatisation", "automatiser", "automatisation des"),
}

MANDATORY_HEADERS = (
    "competences obligatoires", "competences requises", "exigences obligatoires",
    "must have", "required skills", "prerequis obligatoires",
)
PREFERRED_HEADERS = (
    "competences souhaitees", "competences appreciees", "atouts",
    "nice to have", "preferred skills", "souhaitables",
)
NEGATION = re.compile(r"\b(?:pas de|sans|aucune?|ne maitrise pas|not familiar with|no experience with)\b")


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.casefold())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text).strip()


def _has(text: str, alias: str) -> bool:
    return bool(re.search(r"(?<!\w)" + re.escape(normalize(alias)) + r"(?!\w)", text))


def _skill_set(text: str) -> set[str]:
    normalized = normalize(text)
    found = set()
    for canonical, aliases in SKILLS.items():
        if any(_has(normalized, alias) for alias in aliases):
            found.add(canonical)
    return found


def _evidence_skills(cv_text: str) -> set[str]:
    """Avoid treating explicitly negated skills as demonstrated.

    Conservative approximation: if all mentions of a skill are in negated
    sentences, it is not considered demonstrated. This is not full NLI.
    """
    sentences = re.split(r"[\n.!?;]+", cv_text)
    positive = set()
    for sentence in sentences:
        norm = normalize(sentence)
        if NEGATION.search(norm):
            continue
        positive.update(_skill_set(sentence))
    return positive


def _requirements(job_text: str) -> tuple[set[str], set[str], set[str]]:
    """Classify explicitly stated job skills using conservative rules."""
    required: set[str] = set()
    preferred: set[str] = set()
    context: set[str] = set()

    required_headers = MANDATORY_HEADERS + (
        "technologies indispensables",
        "competences indispensables",
        "technologies requises",
        "prerequis techniques",
    )
    preferred_headers = PREFERRED_HEADERS + (
        "competences facultatives",
        "technologies souhaitees",
    )

    required_cues = (
        "vous maitrisez",
        "vous devez maitriser",
        "maitrise de",
        "maitrise des",
        "obligatoire",
        "obligatoires",
        "indispensable",
        "indispensables",
        "experience requise en",
    )
    preferred_cues = (
        "serait un plus",
        "serait apprecie",
        "est un plus",
        "constitue un atout",
        "apprecie",
        "appreciee",
        "apprecies",
        "appreciees",
        "souhaitee",
        "souhaitees",
        "idealement",
    )
    exclusion_cues = (
        "aucune connaissance de",
        "pas necessaire",
        "n'est pas necessaire",
        "ne sont pas necessaires",
        "non requis",
        "non requise",
        "non obligatoire",
        "sans besoin de",
    )

    mode = "context"

    for line in job_text.splitlines():
        norm = normalize(line)

        if not norm:
            mode = "context"
            continue

        mandatory = next(
            (h for h in required_headers if norm.startswith(h)),
            None
        )
        optional = next(
            (h for h in preferred_headers if norm.startswith(h)),
            None
        )

        if mandatory:
            mode = "required"
            norm = norm[len(mandatory):].lstrip(" :-")
        elif optional:
            mode = "preferred"
            norm = norm[len(optional):].lstrip(" :-")
        elif re.match(
            r"^(?:missions|responsabilites|description|entreprise)\s*:",
            norm
        ):
            mode = "context"
        elif norm.startswith("profil recherche"):
            mode = "context"

        sentences = re.split(r"(?<=[.!?])\s+", norm)

        for sentence in sentences:
            if not sentence.strip():
                continue

            # Handle simple mixed clauses separately.
            clauses = re.split(r"[,;]", sentence)

            # In "Python et SQL obligatoires, Power BI apprécié",
            # the cue at the end applies to its preceding clause.
            clause_mode = mode

            for clause in clauses:
                clause = clause.strip()
                skills = _skill_set(clause)

                if any(cue in clause for cue in exclusion_cues):
                    continue

                if any(cue in clause for cue in preferred_cues):
                    clause_mode = "preferred"
                elif any(cue in clause for cue in required_cues):
                    clause_mode = "required"

                if not skills:
                    continue

                if clause_mode == "required":
                    required.update(skills)
                elif clause_mode == "preferred":
                    preferred.update(skills)
                else:
                    context.update(skills)

    preferred.difference_update(required)
    context.difference_update(required | preferred)

    return required, preferred, context


def _requested_years(job_text: str) -> int | None:
    t = normalize(job_text)
    patterns = (
        r"(?:minimum|au moins|min\.?|at least)\s*(\d{1,2})\s*(?:ans?|annees?|years?)",
        r"(\d{1,2})\s*(?:ans?|annees?|years?)\s*(?:d[' ]?experience|experience)",
        r"(\d{1,2})\s*\+\s*(?:ans?|annees?|years?)",
    )
    values = [int(m.group(1)) for p in patterns for m in re.finditer(p, t)]
    return max(values) if values else None


def _documented_years(cv_text: str) -> int | None:
    """Only explicit claims, not dates of education or unrelated internships.

    If no trustworthy duration is found, return unknown rather than zero.
    """
    t = normalize(cv_text)
    matches = re.findall(r"\b(\d{1,2})\s*(?:ans?|annees?|years?)\s*(?:d[' ]?experience|experience)\b", t)
    return max(map(int, matches)) if matches else None


@lru_cache(maxsize=1)
def _model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("distiluse-base-multilingual-cased-v1")


def _semantic_similarity(cv_text: str, job_text: str) -> float | None:
    try:
        from sentence_transformers import util
        model = _model()
        # Long CVs exceed encoder token limits. Compare bounded, non-PII snippets.
        def scrub(s: str) -> str:
            s = re.sub(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", " ", s, flags=re.I)
            s = re.sub(r"https?://\S+", " ", s)
            s = re.sub(r"\+?\d[\d .()-]{8,}\d", " ", s)
            return s
        # A global embedding is a coarse contextual signal, not evidence of skills.
        a, b = scrub(cv_text)[:2500], scrub(job_text)[:2500]
        emb = model.encode([a, b], convert_to_tensor=True, show_progress_bar=False)
        return max(0.0, min(1.0, float(util.cos_sim(emb[0], emb[1]).item())))
    except (ImportError, OSError, RuntimeError, ValueError):
        return None


def calculate_score_detailed(cv_text: str, job_text: str, *, use_semantic: bool = True, experience_months: int | None = None) -> dict[str, Any]:
    """Return score plus traceable component details; never infer hiring odds."""
    if not cv_text or not cv_text.strip() or not job_text or not job_text.strip():
        return {"score": 0.0, "status": "empty_input", "components": {},
                "matched_required": [], "missing_required": [], "matched_preferred": [],
                "missing_preferred": [], "warnings": ["Texte vide."]}

    cv_skills = _evidence_skills(cv_text)
    required, preferred, context = _requirements(job_text)
    matched_required = required & cv_skills
    matched_preferred = preferred & cv_skills
    requested_years = _requested_years(job_text)
    documented_years = _documented_years(cv_text)
    if experience_months is not None:
        if experience_months < 0:
            raise ValueError("experience_months ne peut pas être négatif")
        documented_years = experience_months / 12

    # Missing/unknown components are omitted, not awarded free points.
    components: dict[str, dict[str, float]] = {}
    if required:
        components["required_skills"] = {"value": len(matched_required) / len(required), "weight": 0.50}
    if preferred:
        components["preferred_skills"] = {"value": len(matched_preferred) / len(preferred), "weight": 0.15}
    if context and not required and not preferred:
        components["context_skills"] = {"value": len(context & cv_skills) / len(context), "weight": 0.35}

    if requested_years is not None and documented_years is not None:
        components["experience"] = {"value": min(documented_years / requested_years, 1.0), "weight": 0.15}

    similarity = _semantic_similarity(cv_text, job_text) if use_semantic else None
    if similarity is not None:
        components["semantic"] = {"value": similarity, "weight": 0.20}

    warnings = []
    if requested_years is not None and documented_years is None:
        warnings.append("Durée d'expérience exigée, mais non vérifiable dans le CV ; contrôle humain nécessaire.")
    if not required:
        warnings.append("Aucune liste explicite de compétences obligatoires reconnue.")
    if similarity is None and use_semantic:
        warnings.append("Similarité sémantique indisponible ; calcul sur critères explicites uniquement.")
    if not components:
        warnings.append("Aucun critère fiable identifié ; score non calculable.")

    total_weight = sum(c["weight"] for c in components.values())
    raw_score = sum(c["weight"] * c["value"] for c in components.values()) / total_weight if total_weight else 0.0
    # Hard requirements matter: explicit missing skills impose a transparent cap.
    # This cap is an experimental policy parameter, not a calibrated hiring threshold.
    cap = 1.0
    if required:
        coverage = len(matched_required) / len(required)
        cap = 0.40 + 0.60 * coverage
    score = round(100 * min(raw_score, cap), 2)

    return {
        "score": score,
        "status": "ok" if components else "insufficient_evidence",
        "components": {k: {"score": round(v["value"] * 100, 2), "weight": v["weight"]}
                       for k, v in components.items()},
        "matched_required": sorted(matched_required),
        "missing_required": sorted(required - cv_skills),
        "matched_preferred": sorted(matched_preferred),
        "missing_preferred": sorted(preferred - cv_skills),
        "other_offer_skills": sorted(context),
        "requested_experience_years": requested_years,
        "documented_experience_years": documented_years,
        "warnings": warnings,
        "method": "weighted_evidence_v1_experimental",
        "disclaimer": "Indice de correspondance documentaire, non une probabilité d'embauche.",
    }


def calculate_score(cv_text: str, job_text: str) -> float:
    """Backward-compatible API used by main.py."""
    return calculate_score_detailed(cv_text, job_text)["score"]
