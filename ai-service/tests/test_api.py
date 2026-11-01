import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.main import app


class TestAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)

    def test_extension_interdite(self):
        response = self.client.post(
            "/analyze/",
            files={"file": ("test.txt", b"test", "text/plain")},
            data={"offer": "Développeur Python"}
        )
        self.assertEqual(response.status_code, 400)

    def test_pdf_vide(self):
        response = self.client.post(
            "/analyze/",
            files={"file": ("vide.pdf", b"", "application/pdf")},
            data={"offer": "Développeur Python"}
        )
        self.assertEqual(response.status_code, 422)

    def test_fichier_trop_volumineux(self):
        response = self.client.post(
            "/analyze/",
            files={
                "file": (
                    "grand.pdf",
                    b"x" * (10 * 1024 * 1024 + 1),
                    "application/pdf"
                )
            },
            data={"offer": "Développeur Python"}
        )
        self.assertEqual(response.status_code, 413)


if __name__ == "__main__":
    unittest.main()
