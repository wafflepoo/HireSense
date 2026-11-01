from app.pdf_layout import extract_pdf_text
import re
from spacy.lang.fr.stop_words import STOP_WORDS
from PyPDF2 import PdfReader
import docx
from docx import Document
import string
import os
import zipfile


def extract_text_debug(path):
    """Extraction de texte avec debugging détaillé"""
    text = ""
    file_ext = os.path.splitext(path)[1].lower()

    print(f"[DEBUG] Fichier: {path}")
    print(f"[DEBUG] Extension: {file_ext}")
    print(f"[DEBUG] Fichier existe: {os.path.exists(path)}")
    print(f"[DEBUG] Taille fichier: {os.path.getsize(path) if os.path.exists(path) else 'N/A'} bytes")

    try:
        if str(path).lower().endswith(".pdf"):
            return extract_pdf_text(path)
        elif file_ext == '.docx':
            print(f"[DEBUG] Tentative d'ouverture du fichier Word...")

            # Vérifier si le fichier est un vrai fichier Word
            try:
                with zipfile.ZipFile(path, 'r') as zip_file:
                    file_list = zip_file.namelist()
                    print(f"[DEBUG] Contenu du fichier ZIP: {file_list[:5]}...")  # Premiers 5 fichiers
                    if 'word/document.xml' not in file_list:
                        print("[DEBUG] ERREUR: Pas de document.xml trouvé - fichier Word corrompu")
                        return ""
            except zipfile.BadZipFile:
                print("[DEBUG] ERREUR: Fichier n'est pas un ZIP valide")
                return ""

            # Extraction avec python-docx
            try:
                doc = Document(path)
                print(f"[DEBUG] Document ouvert avec succès")
                print(f"[DEBUG] Nombre de paragraphes: {len(doc.paragraphs)}")

                # Extraction des paragraphes
                paragraph_count = 0
                for paragraph in doc.paragraphs:
                    if paragraph.text.strip():
                        text += paragraph.text + "\n"
                        paragraph_count += 1

                print(f"[DEBUG] Paragraphes avec contenu: {paragraph_count}")

                # Extraction des tableaux
                print(f"[DEBUG] Nombre de tableaux: {len(doc.tables)}")
                table_text = ""
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            cell_text = cell.text.strip()
                            if cell_text:
                                table_text += cell_text + " "

                text += table_text
                print(f"[DEBUG] Texte des tableaux: {len(table_text)} caractères")

            except Exception as docx_error:
                print(f"[DEBUG] Erreur python-docx: {docx_error}")

                # Fallback: essayer avec une méthode alternative
                print("[DEBUG] Tentative avec méthode alternative...")
                try:
                    import xml.etree.ElementTree as ET

                    with zipfile.ZipFile(path) as docx_zip:
                        # Lire le document principal
                        try:
                            doc_xml = docx_zip.read('word/document.xml')
                            root = ET.fromstring(doc_xml)

                            # Extraire tout le texte
                            for elem in root.iter():
                                if elem.text:
                                    text += elem.text + " "

                            print(f"[DEBUG] Extraction XML réussie: {len(text)} caractères")

                        except KeyError:
                            print("[DEBUG] Pas de word/document.xml trouvé")

                except Exception as xml_error:
                    print(f"[DEBUG] Erreur extraction XML: {xml_error}")

        else:
            print(f"[DEBUG] Format de fichier non supporté: {file_ext}")
            return ""

    except Exception as e:
        print(f"[DEBUG] Erreur générale d'extraction: {e}")
        return ""

    print(f"[DEBUG] Texte final extrait: {len(text)} caractères")
    if text:
        print(f"[DEBUG] Aperçu du texte: '{text[:200]}...'")
    else:
        print("[DEBUG] AUCUN TEXTE EXTRAIT!")

    return text


stop_words = STOP_WORDS

# Liste des langues courantes
LANGUES_COURANTES = {
    'français', 'anglais', 'espagnol', 'allemand', 'italien', 'portugais',
    'chinois', 'japonais', 'arabe', 'russe', 'hindi', 'néerlandais',
    'suédois', 'norvégien', 'danois', 'finlandais', 'polonais', 'tchèque',
    'hongrois', 'roumain', 'bulgare', 'grec', 'turc', 'hébreu', 'coréen',
    'thaï', 'vietnamien', 'indonésien', 'malais', 'tagalog', 'swahili',
    'french', 'english', 'spanish', 'german', 'italian', 'portuguese',
    'chinese', 'japanese', 'arabic', 'russian', 'dutch', 'swedish',
    'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian',
    'romanian', 'bulgarian', 'greek', 'turkish', 'hebrew', 'korean',
    'thai', 'vietnamese', 'indonesian', 'malay', 'tagalog', 'swahili'
}


def clean_text(t):
    t = t.strip().lower()
    t = t.translate(str.maketrans('', '', string.punctuation))
    return t


def is_valid_entity(ent_text):
    t = clean_text(ent_text)
    return len(t) > 2 and not all(w in stop_words for w in t.split())


def is_language(text):
    """Détecter si un texte correspond à une langue"""
    cleaned = clean_text(text)
    return cleaned in LANGUES_COURANTES


def extract_entities_structured_auto_debug(text):
    """Extraction structurée des informations d'un CV."""
    import re
    import unicodedata

    categories = {
        "competences": [],
        "experiences": [],
        "diplomes": [],
        "postes": [],
        "langues": [],
    }

    if not text or not text.strip():
        return categories

    def normalize(value):
        value = unicodedata.normalize("NFKD", value.casefold())
        value = "".join(
            c for c in value if not unicodedata.combining(c)
        )
        return re.sub(r"\s+", " ", value).strip()

    def contains(value, term):
        pattern = r"(?<!\w)" + re.escape(normalize(term)) + r"(?!\w)"
        return bool(re.search(pattern, normalize(value)))

    headings = {
        "profil": "profil",
        "a propos": "profil",
        "resume": "profil",
        "competences": "competences",
        "competences techniques": "competences",
        "skills": "competences",
        "formations": "formation",
        "formation": "formation",
        "education": "formation",
        "experiences professionnelles": "experiences",
        "experience professionnelle": "experiences",
        "experiences": "experiences",
        "experience": "experiences",
        "professional experience": "experiences",
        "langues": "langues",
        "languages": "langues",
        "projets": "projets",
        "projets academiques": "projets",
        "projets personnels": "projets",
        "centres d'interet": "autres",
        "loisirs": "autres",
    }

    sections = []
    current = "inconnu"

    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue

        key = normalize(line).strip(" :-|")
        if key in headings:
            current = headings[key]
            continue

        sections.append((current, line))

    skills = {
        "Python": ["python"],
        "SQL": ["sql"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "Power BI": ["power bi", "powerbi"],
        "Excel": ["excel"],
        "Tableau": ["tableau software", "tableau"],
        "Docker": ["docker"],
        "Git": ["git"],
        "GitHub": ["github"],
        "GitLab": ["gitlab"],
        "Java": ["java"],
        "JavaScript": ["javascript"],
        "TypeScript": ["typescript"],
        "React": ["react", "react.js", "reactjs"],
        "Node.js": ["node.js", "nodejs"],
        "FastAPI": ["fastapi"],
        "Flask": ["flask"],
        "Django": ["django"],
        "PostgreSQL": ["postgresql", "postgres"],
        "MySQL": ["mysql"],
        "MongoDB": ["mongodb"],
        "Spark": ["spark", "pyspark"],
        "Airflow": ["airflow"],
        "AWS": ["aws"],
        "Azure": ["azure"],
        "GCP": ["gcp", "google cloud"],
        "Snowflake": ["snowflake"],
        "Streamlit": ["streamlit"],
        "Matplotlib": ["matplotlib"],
        "Seaborn": ["seaborn"],
        "TensorFlow": ["tensorflow"],
        "PyTorch": ["pytorch"],
        "NLP": ["nlp"],
        "Machine Learning": ["machine learning"],
        "API REST": ["api rest", "rest api"],
        "Automatisation": ["automatisation"],
        "Kubernetes": ["kubernetes", "k8s"],
        "Terraform": ["terraform"],
        "Jenkins": ["jenkins"],
        "Linux": ["linux", "ubuntu", "debian", "red hat", "rhel"],
        "CI/CD": ["ci/cd", "ci cd", "continuous integration", "continuous deployment"],
        "Ansible": ["ansible"],
        "Prometheus": ["prometheus"],
        "Grafana": ["grafana"],
        "Helm": ["helm charts", "helm"],
        "SRE": ["site reliability engineering", "sre"],
    }

    competences = set()
    for section, line in sections:
        if section in {"formation", "langues", "autres"}:
            continue
        for name, aliases in skills.items():
            if any(contains(line, alias) for alias in aliases):
                competences.add(name)

    languages = {
        "Français": ["francais", "french"],
        "Anglais": ["anglais", "english"],
        "Arabe": ["arabe", "arabic"],
        "Espagnol": ["espagnol", "spanish"],
        "Allemand": ["allemand", "german"],
        "Italien": ["italien", "italian"],
        "Portugais": ["portugais", "portuguese"],
        "Chinois": ["chinois", "chinese"],
        "Japonais": ["japonais", "japanese"],
        "Russe": ["russe", "russian"],
    }

    langues = set()
    level_pattern = re.compile(
        r"\b(?:a1|a2|b1|b2|c1|c2|bilingue|"
        r"courant|maternel|maternelle|natif|native)\b"
    )

    for section, line in sections:
        for name, aliases in languages.items():
            if any(contains(line, alias) for alias in aliases):
                if section == "langues" or level_pattern.search(normalize(line)):
                    langues.add(name)

    # Les CV multicolonnes peuvent séparer noms et niveaux.
    # Un nom de langue est accepté lorsqu'il apparaît près
    # du titre LANGUES, et non simplement partout dans le CV.
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if normalize(line).strip(" :-|") in {"langues", "languages"}:
            nearby = "\n".join(lines[index + 1:index + 9])
            for name, aliases in languages.items():
                if any(contains(nearby, alias) for alias in aliases):
                    langues.add(name)

    diploma_re = re.compile(
        r"\b(?:master(?:\s+[12])?|licence(?:\s+[123])?|"
        r"bachelor|bts|but|doctorat|baccalaureat)\b"
    )

    future_re = re.compile(
        r"\b(?:recherche|souhaite|envisage|integrer|"
        r"admission|candidature|a partir de|des|des septembre|"
        r"prochainement|futur|future)\b"
    )

    diplomes = set()
    for section, line in sections:
        normalized = normalize(line)
        if not diploma_re.search(normalized):
            continue

        # Un diplôme mentionné dans un objectif professionnel
        # n'est pas une formation suivie.
        if section != "formation":
            continue

        if future_re.search(normalized):
            continue

        cleaned = re.sub(
            r"^\s*(?:19|20)\d{2}\s*[-–:]?\s*",
            "",
            line
        ).strip()

        # Ne pas prendre un classement scolaire pour un diplôme.
        if re.search(r"\btop\s*\d+\b", normalized):
            match = diploma_re.search(normalized)
            if match:
                diplomes.add(match.group(0).title())
            continue

        diplomes.add(cleaned.strip(" |•·:-–—\t"))

    # Les intitulés et dates sont reconnus dans les sections professionnelles.
    # Les missions seules ne doivent pas devenir des expériences.
    job_terms = {
        "Ingénieur DevOps": ["ingenieur devops", "devops engineer"],
        "Administrateur systèmes": ["administrateur systemes", "system administrator", "administrateur linux"],
        "Ingénieur Cloud": ["ingenieur cloud", "cloud engineer"],
        "Data Analyst": ["data analyst"],
        "Data Scientist": ["data scientist"],
        "Data Engineer": ["data engineer"],
        "Business Analyst": ["business analyst"],
        "Chef de projet": ["chef de projet"],
        "Développeur": ["developpeur", "developer"],
        "Ingénieur": ["ingenieur", "engineer"],
        "Consultant": ["consultant"],
        "Technicien support": ["technicien support", "support technician"],
        "Assistant administratif": ["assistant administratif", "assistante administrative"],
    }
    month = r"(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
    date_token = rf"(?:{month}\s+)?(?:19|20)\d{{2}}|(?:0?[1-9]|1[0-2])/(?:19|20)\d{{2}}"
    date_re = re.compile(rf"(?<!\d)(?:{date_token})(?!\d)")
    year_re = re.compile(r"\b(?:19|20)\d{2}\b")
    section_lines = [line for section, line in sections if section == "experiences"]
    # Intitulé de poste au début, éventuellement précédé d'une date.
    role_re = re.compile(
        r"^(?:(?:19|20)\d{2}\s*[-–:|]\s*)?"
        r"(?:stagiaire|alternant(?:e)?|assistant(?:e)?|"
        r"ingenieur|developpeur|consultant|administrateur|"
        r"technicien|responsable|analyste|data analyst|"
        r"data engineer|data scientist|chef de projet|"
        r"devops engineer|cloud engineer|system administrator)\b"
    )
    def is_header(line):
        n = normalize(line).strip(" |•-–—")
        if not n or len(n) > 220:
            return False
        if role_re.search(n):
            return True
        # Date + séparateur + intitulé libre (p. ex. « 2020–2023 | SRE »).
        if year_re.search(n) and re.search(r"\b(?:devops|sre|support|systemes|cloud|data|reseau)\b", n):
            return True
        return False

    experiences = []
    current = []
    def flush():
        if current:
            entry = re.sub(r"\s+", " ", " ".join(current)).strip(" |•-–—")
            if entry and entry not in experiences:
                experiences.append(entry)

    for line in section_lines:
        if is_header(line):
            flush()
            current = [line]
            continue
        if not current:
            continue
        header = normalize(" ".join(current))
        if len(date_re.findall(header)) >= 2:
            flush()
            current = []
            continue
        n = normalize(line)
        if re.match(r"^(?:analyse|developpement|creation|participation|gestion|mise en place|automatisation|extraction|controle|conception|deploiement|maintenance|supervision|administration|realisation)\b", n):
            flush()
            current = []
            continue
        if len(current) < 3 and len(line) < 120:
            current.append(line)
    flush()

    postes = set()
    for experience in experiences:
        n = normalize(experience)
        for name, aliases in job_terms.items():
            if any(contains(n, alias) for alias in aliases):
                postes.add(name)
    # Ne pas retourner « Ingénieur » si « Ingénieur DevOps » est reconnu.
    if "Ingénieur DevOps" in postes or "Ingénieur Cloud" in postes:
        postes.discard("Ingénieur")

    return {
        "competences": sorted(competences),
        "experiences": experiences,
        "diplomes": sorted(diplomes),
        "postes": sorted(postes),
        "langues": sorted(langues),
    }

# Fonctions d'alias pour la compatibilité
def extract_text(path):
    return extract_text_debug(path)


def extract_entities_structured_auto(text):
    return extract_entities_structured_auto_debug(text)