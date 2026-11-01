"""Structuration prudente d'expériences déjà extraites de CV.

Une durée est une durée calendaire inclusive en mois, pas une équivalence temps plein.
"""
import re
import unicodedata
from datetime import date

MONTHS = {
    'janvier':1,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'aout':8,'septembre':9,'octobre':10,'novembre':11,'decembre':12,
    'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12,
}
MONTH_PATTERN = '|'.join(sorted(MONTHS, key=len, reverse=True))
DATE_TOKEN = rf'(?:(?:{MONTH_PATTERN})\s+(?:19|20)\d{{2}}|(?:0?[1-9]|1[0-2])/(?:19|20)\d{{2}}|(?:19|20)\d{{2}}|present|actuel(?:lement)?|aujourd.hui)'
DATE_RANGE = re.compile(rf'(?<!\w)(?P<start>{DATE_TOKEN})\s*(?:-|–|—|\ba\b|\bto\b)\s*(?P<end>{DATE_TOKEN})(?!\w)', re.I)
DURATION = re.compile(r'^\s*\(\s*\d+\s+ans?(?:\s+et\s+\d+\s+mois)?\s*\)\s*\.?\s*', re.I)
TASK_START = re.compile(r'\b(?:administration|analyse|conception|deploiement|developpement|gestion|maintenance|supervision|automatisation|creation|realisation|participation|traitement|redaction|qualification|mise en place)\b', re.I)

def _normalize(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s.casefold()) if not unicodedata.combining(c))

def _parse_date(value, today=None):
    today = today or date.today()
    v = _normalize(value.strip())
    if v in ('present','actuel','actuellement','aujourd hui',"aujourd'hui"):
        return f'{today.year:04d}-{today.month:02d}'
    m = re.fullmatch(r'(\d{1,2})/(\d{4})', v)
    if m:
        month, year = map(int, m.groups())
        return f'{year:04d}-{month:02d}' if 1 <= month <= 12 else None
    m = re.fullmatch(r'([a-z]+)\s+(\d{4})', v)
    if m and m.group(1) in MONTHS:
        return f'{int(m.group(2)):04d}-{MONTHS[m.group(1)]:02d}'
    if re.fullmatch(r'(19|20)\d{2}', v):
        return f'{v}-01'  # Année seule : mois inconnu, ne pas utiliser pour la durée.
    return None

def _month_index(iso):
    y, m = map(int, iso.split('-'))
    return y * 12 + m

def extract_experiences_detailed(experiences, today=None):
    """Renvoie des dicts sérialisables. Ne déduit jamais une entreprise sans séparateur."""
    results = []
    for raw in experiences:
        raw = re.sub(r'\s+', ' ', str(raw)).strip()
        if not raw:
            continue
        match = DATE_RANGE.search(_normalize(raw))
        start = end = None
        duration = None
        rest = raw
        if match:
            # Les indices sont conservés par la normalisation NFKD pour les caractères usuels.
            start_token, end_token = match.group('start'), match.group('end')
            start = _parse_date(start_token, today)
            end = _parse_date(end_token, today)
            rest = (raw[:match.start()] + ' ' + raw[match.end():]).strip(' |•-–—:')
            if start and end and not re.fullmatch(r'(19|20)\d{2}', start_token) and not re.fullmatch(r'(19|20)\d{2}', end_token):
                a, b = _month_index(start), _month_index(end)
                if b >= a:
                    duration = b - a + 1
        rest = DURATION.sub('', rest).strip()
        # Une phrase après un point est généralement une mission; conserver le texte brut si incertain.
        desc = ''
        split = re.search(r'\.\s+(?=[A-ZÀ-Ý])', rest)
        if split:
            desc = rest[split.end():].strip()
            rest = rest[:split.start()].strip()
        role, company = rest, None
        split_company = re.split(r'\s+[-–—|]\s+', rest, maxsplit=1)
        if len(split_company) == 2:
            role, company = (s.strip() for s in split_company)
            company = re.sub(r'\s*\(\d+\s+ans?(?:\s+et\s+\d+\s+mois)?\)\s*$', '', company, flags=re.I).strip()
        # Pas de découpage arbitraire des noms composés sans séparateur.
        results.append({
            'poste': role or None,
            'entreprise': company or None,
            'date_debut': start,
            'date_fin': end,
            'duree_mois': duration,
            'description': desc,
            'texte_original': raw,
        })
    return results

def total_experience_months(details):
    """Union des mois documentés, sans double comptage des chevauchements."""
    months = set()
    for item in details:
        if item.get('duree_mois') is None:
            continue
        a = _month_index(item['date_debut'])
        b = _month_index(item['date_fin'])
        months.update(range(a, b + 1))
    return len(months)
