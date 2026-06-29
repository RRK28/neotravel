#!/usr/bin/env python3
"""Convertit note-de-cadrage.md en PDF simple (fpdf2)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "docs" / "note-de-cadrage.md"
PDF_PATH = ROOT / "docs" / "note-de-cadrage.pdf"


FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


MARGIN_MM = 20  # 2 cm
HEADER_FOOTER_FONT_SIZE = 8
_in_code_block = False


class DocPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.add_font("Doc", "", FONT)
        self.add_font("Doc", "B", FONT)
        self.add_font("Doc", "I", FONT)

    def header(self):
        self.set_font("Doc", "I", HEADER_FOOTER_FONT_SIZE)
        self.set_text_color(120, 120, 120)
        left = "Note de cadrage NeoTravel"
        right = "Groupe 16"
        line_h = 5
        self.set_x(self.l_margin)
        self.cell(self.epw / 2, line_h, left, new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_x(self.l_margin + self.epw / 2)
        self.cell(
            self.epw / 2,
            line_h,
            right,
            align="R",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
        self.ln(2)

    def footer(self):
        self.set_y(-MARGIN_MM)
        self.set_font("Doc", "I", HEADER_FOOTER_FONT_SIZE)
        self.set_text_color(120, 120, 120)
        self.set_x(self.l_margin)
        self.cell(
            self.epw,
            5,
            f"Page {self.page_no()}",
            align="C",
            new_x=XPos.LMARGIN,
            new_y=YPos.TOP,
        )


def mc(pdf: DocPDF, h: float, text: str) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, h, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


_in_code_block = False


def write_line(pdf: DocPDF, line: str) -> None:
    global _in_code_block
    line = line.rstrip()

    if line.startswith("```"):
        _in_code_block = not _in_code_block
        if _in_code_block:
            pdf.ln(2)
        else:
            pdf.ln(3)
        return

    if _in_code_block:
        pdf.set_font("Doc", "", 8)
        pdf.set_text_color(30, 30, 30)
        mc(pdf, 4, line if line else " ")
        return

    if not line:
        pdf.ln(3)
        return

    if line.startswith("# "):
        pdf.ln(4)
        pdf.set_font("Doc", "B", 16)
        pdf.set_text_color(20, 20, 20)
        mc(pdf, 8, line[2:].strip())
        pdf.ln(2)
        return

    if line.startswith("## "):
        pdf.ln(3)
        pdf.set_font("Doc", "B", 12)
        pdf.set_text_color(30, 30, 30)
        mc(pdf, 7, line[3:].strip())
        pdf.ln(1)
        return

    if line.startswith("---"):
        pdf.ln(2)
        pdf.set_draw_color(200, 200, 200)
        y = pdf.get_y()
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(4)
        return

    if line.startswith("|") and "---" not in line:
        pdf.set_font("Doc", "", 9)
        pdf.set_text_color(40, 40, 40)
        cells = [c.strip() for c in line.strip("|").split("|")]
        text = "  ·  ".join(cells)
        mc(pdf, 5, text)
        return

    if line.startswith("|") and "---" in line:
        return

    if line.startswith("- "):
        pdf.set_font("Doc", "", 10)
        pdf.set_text_color(40, 40, 40)
        mc(pdf, 5, "  - " + clean_md(line[2:]))
        return

    if re.match(r"^\d+\.\s", line):
        pdf.set_font("Doc", "", 10)
        pdf.set_text_color(40, 40, 40)
        mc(pdf, 5, "  " + clean_md(line))
        return

    pdf.set_font("Doc", "", 10)
    pdf.set_text_color(40, 40, 40)
    mc(pdf, 5, clean_md(line))


def clean_md(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = text.replace("*", "")
    return text


def main() -> int:
    global _in_code_block
    _in_code_block = False

    md_path = Path(sys.argv[1]) if len(sys.argv) > 1 else MD_PATH
    pdf_path = Path(sys.argv[2]) if len(sys.argv) > 2 else PDF_PATH

    text = md_path.read_text(encoding="utf-8")
    pdf = DocPDF()
    pdf.set_margins(MARGIN_MM, MARGIN_MM, MARGIN_MM)
    pdf.set_auto_page_break(auto=True, margin=MARGIN_MM)
    pdf.add_page()

    for line in text.splitlines():
        write_line(pdf, line)

    pdf.output(str(pdf_path))
    print(f"PDF généré : {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
