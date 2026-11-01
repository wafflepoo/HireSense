import unittest
from app.scoring import _requirements


class TestJobRequirementsEdgeCases(unittest.TestCase):

    def test_phrase_mixte(self):
        offer = (
            "Python et SQL obligatoires, "
            "Power BI apprécié."
        )

        required, preferred, context = _requirements(offer)

        self.assertEqual(required, {"Python", "SQL"})
        self.assertEqual(preferred, {"Power BI"})

    def test_negation(self):
        offer = (
            "Compétences requises : Python et SQL.\n"
            "Aucune connaissance de Docker n'est nécessaire."
        )

        required, preferred, context = _requirements(offer)

        self.assertEqual(required, {"Python", "SQL"})
        self.assertNotIn("Docker", required)
        self.assertNotIn("Docker", preferred)

    def test_sections_multilignes(self):
        offer = """
Compétences obligatoires :
Python
SQL
Power BI

Compétences souhaitées :
Tableau
Docker
"""
        required, preferred, context = _requirements(offer)

        self.assertEqual(
            required, {"Python", "SQL", "Power BI"}
        )
        self.assertEqual(
            preferred, {"Tableau", "Docker"}
        )


if __name__ == "__main__":
    unittest.main()
