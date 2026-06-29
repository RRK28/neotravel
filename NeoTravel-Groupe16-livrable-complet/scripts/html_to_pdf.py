#!/usr/bin/env python3
"""Convertit mode-emploi-visuel.html en PDF via Playwright."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "docs" / "mode-emploi-visuel.html"
PDF_PATH = ROOT / "docs" / "mode-emploi-visuel.pdf"


def main() -> int:
    html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else HTML_PATH
    pdf_path = Path(sys.argv[2]) if len(sys.argv) > 2 else PDF_PATH

    if not html_path.exists():
        print(f"Fichier introuvable : {html_path}", file=sys.stderr)
        return 1

    from playwright.sync_api import sync_playwright

    url = html_path.resolve().as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            margin={"top": "15mm", "bottom": "15mm", "left": "15mm", "right": "15mm"},
        )
        browser.close()

    print(f"PDF généré : {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
