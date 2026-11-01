import unittest

from app.experience_details import (
    extract_experiences_detailed,
    total_experience_months,
)


class TestExperienceDetails(unittest.TestCase):

    def test_devops(self):
        items = extract_experiences_detailed([
            "Janvier 2022 - Octobre 2026 | Ingénieur DevOps Senior - CloudNova (4 ans et 10 mois). Administration de clusters",
            "Janvier 2020 - Décembre 2021 | Ingénieur DevOps - InfraTech (2 ans). Administration Linux",
        ])

        self.assertEqual(items[0]["poste"], "Ingénieur DevOps Senior")
        self.assertEqual(items[0]["entreprise"], "CloudNova")
        self.assertEqual(items[0]["duree_mois"], 58)
        self.assertEqual(total_experience_months(items), 82)

    def test_overlap(self):
        items = extract_experiences_detailed([
            "Janvier 2024 - Décembre 2024 | Analyste - A",
            "Juin 2024 - Mars 2025 | Consultant - B",
        ])

        self.assertEqual(total_experience_months(items), 15)

    def test_unknown_dates(self):
        items = extract_experiences_detailed([
            "2022 - 2024 | Ingénieur - A"
        ])

        self.assertIsNone(items[0]["duree_mois"])


if __name__ == "__main__":
    unittest.main()
