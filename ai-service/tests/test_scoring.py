import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.scoring import calculate_score_detailed, calculate_score

DATA = '''EXPÉRIENCES PROFESSIONNELLES\nStagiaire Data Analyst : Python, SQL, Excel, Power BI, Pandas, Git, Streamlit, automatisation.\n'''
GOOD = '''Data Analyst Junior\nCompétences obligatoires : Python, SQL, Excel, Power BI.\nCompétences souhaitées : Pandas, Git, Streamlit, automatisation.\n'''
BAD = '''Ingénieur DevOps Senior. Au moins 5 ans d'expérience.\nCompétences obligatoires : Kubernetes, Terraform, AWS, Jenkins, Linux, CI/CD.\nCompétences souhaitées : Ansible, Prometheus, Grafana, Helm.\n'''

class TestScoring(unittest.TestCase):
    def test_match_requirements(self):
        result = calculate_score_detailed(DATA, GOOD, use_semantic=False)
        self.assertEqual(len(result['matched_required']), 4)
        self.assertEqual(len(result['missing_required']), 0)
        self.assertEqual(len(result['matched_preferred']), 4)
    def test_senior_rejected_as_document_match(self):
        result = calculate_score_detailed(DATA, BAD, use_semantic=False)
        self.assertEqual(len(result['matched_required']), 0)
        self.assertEqual(result['requested_experience_years'], 5)
        self.assertIsNone(result['documented_experience_years'])
        self.assertLess(result['score'], 50)
    def test_ordering(self):
        self.assertGreater(calculate_score_detailed(DATA, GOOD, use_semantic=False)['score'],
                           calculate_score_detailed(DATA, BAD, use_semantic=False)['score'])
    def test_no_automatic_experience_bonus(self):
        r = calculate_score_detailed(DATA, GOOD, use_semantic=False)
        self.assertNotIn('experience', r['components'])
    def test_empty(self):
        self.assertEqual(calculate_score_detailed('', GOOD)['score'], 0)
    def test_negative_skill(self):
        r = calculate_score_detailed('Je ne maîtrise pas Kubernetes.',
              'Compétences obligatoires : Kubernetes.', use_semantic=False)
        self.assertEqual(r['matched_required'], [])
    def test_unknown_not_zero(self):
        r = calculate_score_detailed(DATA, BAD, use_semantic=False)
        self.assertIsNone(r['documented_experience_years'])

if __name__ == '__main__':
    unittest.main()
