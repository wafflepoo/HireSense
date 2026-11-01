import unittest
from app.scoring import _requirements


class TestJobRequirements(unittest.TestCase):

    def test_competences_requises(self):
        required, preferred, _ = _requirements(
            "Compétences requises : Python, SQL, Power BI"
        )
        self.assertEqual(required, {"Python", "SQL", "Power BI"})
        self.assertEqual(preferred, set())

    def test_competences_souhaitees(self):
        required, preferred, _ = _requirements(
            "Compétences requises : Python, SQL\n"
            "Compétences souhaitées : Tableau, Docker"
        )
        self.assertEqual(required, {"Python", "SQL"})
        self.assertEqual(preferred, {"Tableau", "Docker"})

    def test_technologies_indispensables(self):
        required, _, _ = _requirements(
            "Technologies indispensables : Python, SQL, Power BI"
        )
        self.assertEqual(required, {"Python", "SQL", "Power BI"})

    def test_formulation_naturelle(self):
        required, preferred, _ = _requirements(
            "Profil recherché : vous maîtrisez Python, SQL et Power BI. "
            "Une connaissance de Tableau serait un plus."
        )
        self.assertEqual(required, {"Python", "SQL", "Power BI"})
        self.assertEqual(preferred, {"Tableau"})


if __name__ == "__main__":
    unittest.main()
