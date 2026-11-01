import unittest

from app.scoring import calculate_score_detailed


OFFER = """
Ingénieur DevOps.
Compétences requises : Python, Docker.
Minimum 5 ans d'expérience.
"""

CV = "Ingénieur DevOps. Python, Docker."


class TestScoringExperience(unittest.TestCase):

    def test_experience_suffisante(self):
        result = calculate_score_detailed(
            CV, OFFER, use_semantic=False,
            experience_months=82
        )
        self.assertEqual(
            result["components"]["experience"]["score"], 100.0
        )
        self.assertAlmostEqual(
            result["documented_experience_years"], 82 / 12
        )

    def test_experience_insuffisante(self):
        result = calculate_score_detailed(
            CV, OFFER, use_semantic=False,
            experience_months=24
        )
        self.assertEqual(
            result["components"]["experience"]["score"], 40.0
        )

    def test_experience_inconnue(self):
        result = calculate_score_detailed(
            CV, OFFER, use_semantic=False
        )
        self.assertNotIn("experience", result["components"])
        self.assertTrue(
            any("non vérifiable" in w for w in result["warnings"])
        )


if __name__ == "__main__":
    unittest.main()
