"""Extraction PDF avec reconstruction géométrique adaptative."""

from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass(frozen=True)
class TextBlock:
    x0: float
    y0: float
    x1: float
    y1: float
    text: str


def _extract_blocks(page):
    """Extrait les blocs textuels avec leurs coordonnées."""
    blocks = []

    for block in page.get_text("blocks"):
        if len(block) < 5 or not isinstance(block[4], str):
            continue

        text = block[4].strip()

        if not text:
            continue

        blocks.append(
            TextBlock(
                x0=float(block[0]),
                y0=float(block[1]),
                x1=float(block[2]),
                y1=float(block[3]),
                text=text,
            )
        )

    return blocks


def _find_horizontal_bands(blocks, page_height):
    """
    Découpe la page en bandes verticales selon les ruptures
    observées dans la répartition des blocs.

    Les bandes permettent de traiter des mises en page mixtes.
    """
    if not blocks:
        return []

    ordered = sorted(blocks, key=lambda b: (b.y0, b.x0))

    heights = sorted(max(1.0, b.y1 - b.y0) for b in ordered)
    median_height = heights[len(heights) // 2]

    gap_threshold = max(12.0, min(36.0, median_height * 0.8))

    bands = []
    current = [ordered[0]]
    current_bottom = ordered[0].y1

    for block in ordered[1:]:
        gap = block.y0 - current_bottom

        if gap > gap_threshold:
            bands.append(current)
            current = [block]
            current_bottom = block.y1
        else:
            current.append(block)
            current_bottom = max(current_bottom, block.y1)

    bands.append(current)
    return bands


def _group_columns(blocks, page_width):
    """
    Regroupe les blocs selon leurs intervalles horizontaux.

    Aucun nombre de colonnes n'est imposé.
    """
    if not blocks:
        return []

    tolerance = max(4.0, page_width * 0.012)

    ordered = sorted(blocks, key=lambda b: (b.x0, b.y0))

    columns = []

    for block in ordered:
        best_index = None
        best_overlap = 0.0

        for index, column in enumerate(columns):
            left = min(item.x0 for item in column)
            right = max(item.x1 for item in column)

            overlap = min(right, block.x1) - max(left, block.x0)

            if overlap > best_overlap and overlap > tolerance:
                best_overlap = overlap
                best_index = index

        if best_index is None:
            columns.append([block])
        else:
            columns[best_index].append(block)

    columns.sort(key=lambda column: min(item.x0 for item in column))

    return columns


def _order_band(blocks, page_width):
    """
    Reconstruit l'ordre de lecture d'une bande.

    Si plusieurs colonnes sont détectées, lecture de gauche
    à droite, puis de haut en bas dans chaque colonne.
    """
    columns = _group_columns(blocks, page_width)

    if not columns:
        return []

    result = []

    for column in columns:
        result.extend(
            sorted(column, key=lambda b: (b.y0, b.x0))
        )

    return result


def extract_pdf_text(path):
    """
    Extrait un PDF page par page avec une reconstruction
    adaptative de l'ordre de lecture.

    Retourne une chaîne de caractères.
    """
    path = Path(path)
    pages_text = []

    with pymupdf.open(str(path)) as document:
        for page in document:
            blocks = _extract_blocks(page)

            if not blocks:
                pages_text.append("")
                continue

            bands = _find_horizontal_bands(
                blocks,
                page.rect.height,
            )

            ordered_blocks = []

            for band in bands:
                ordered_blocks.extend(
                    _order_band(band, page.rect.width)
                )

            pages_text.append(
                "\n".join(block.text for block in ordered_blocks)
            )

    return "\n\n".join(pages_text)
