import sys
import unittest
from pathlib import Path

# Permet d'importer le module depuis ai-service/tests
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.extract_text import extract_entities_structured_auto


CV_FICTIF = """
PROFIL
Étudiant en Master Informatique, à la recherche
d'une alternance en Data Engineering.

COMPÉTENCES
Python, SQL, Pandas, Docker, Git, Power BI.
Développement d'API REST et automatisation.

FORMATION
2025 - Licence 3 Informatique
2026 - Master 1 Informatique

EXPÉRIENCES PROFESSIONNELLES
2025 - Stagiaire Data Analyst chez TechNova.
Analyse de données avec Python et SQL.

LANGUES
Français : langue maternelle
Anglais : niveau C1

CENTRES D'INTÉRÊT
Cinéma, Netflix, lecture.
"""


class TestExtraction(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.resultat = extract_entities_structured_auto(CV_FICTIF)

    def test_structure(self):
        for categorie in (
            "competences",
            "experiences",
            "diplomes",
            "postes",
            "langues",
        ):
            self.assertIn(categorie, self.resultat)
            self.assertIsInstance(self.resultat[categorie], list)

    def test_competences(self):
        competences = self.resultat["competences"]

        for competence in ("Python", "SQL", "Pandas"):
            with self.subTest(competence=competence):
                self.assertIn(competence, competences)

    def test_diplomes(self):
        diplomes = " ".join(self.resultat["diplomes"]).lower()

        self.assertIn("master", diplomes)
        self.assertIn("licence", diplomes)

    def test_langues(self):
        langues = " ".join(self.resultat["langues"]).lower()

        self.assertIn("français", langues)
        self.assertIn("anglais", langues)

    def test_faux_positifs(self):
        competences = " ".join(
            self.resultat["competences"]
        ).lower()

        self.assertNotIn("netflix", competences)
        self.assertNotIn("master", competences)
        self.assertNotIn("licence", competences)


    def test_postes(self):
        postes = " ".join(self.resultat["postes"]).lower()

        self.assertIn("data analyst", postes)

    def test_experiences(self):
        experiences = " ".join(
            self.resultat["experiences"]
        ).lower()

        self.assertIn("technova", experiences)
        self.assertNotIn("data engineering", experiences)
        
if __name__ == "__main__":
    unittest.main(verbosity=2)
