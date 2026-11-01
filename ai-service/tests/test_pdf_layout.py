import sys
import tempfile
import unittest
from pathlib import Path

import pymupdf

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.pdf_layout import extract_pdf_text


class TestPDFLayout(unittest.TestCase):

    def create_pdf(self, columns):
        temp = tempfile.TemporaryDirectory()
        path = Path(temp.name) / "test.pdf"

        doc = pymupdf.open()
        page = doc.new_page(width=600, height=800)

        margin = 30
        usable_width = 540
        column_width = usable_width / columns

        for index in range(columns):
            x = margin + index * column_width

            page.insert_text(
                (x, 80),
                f"COLONNE_{index + 1}",
                fontsize=10,
            )

            page.insert_text(
                (x, 110),
                f"CONTENU_{index + 1}",
                fontsize=10,
            )

        doc.save(str(path))
        doc.close()

        return temp, path

    def test_one_column(self):
        temp, path = self.create_pdf(1)
        try:
            text = extract_pdf_text(path)
            self.assertIn("COLONNE_1", text)
            self.assertIn("CONTENU_1", text)
        finally:
            temp.cleanup()

    def test_two_columns(self):
        temp, path = self.create_pdf(2)
        try:
            text = extract_pdf_text(path)
            self.assertIn("COLONNE_1", text)
            self.assertIn("COLONNE_2", text)
        finally:
            temp.cleanup()

    def test_three_columns(self):
        temp, path = self.create_pdf(3)
        try:
            text = extract_pdf_text(path)
            for index in range(1, 4):
                self.assertIn(f"COLONNE_{index}", text)
                self.assertIn(f"CONTENU_{index}", text)
        finally:
            temp.cleanup()


if __name__ == "__main__":
    unittest.main()
