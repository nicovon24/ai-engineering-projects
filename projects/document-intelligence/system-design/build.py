"""Build the current Document Intelligence service diagrams as SVG files."""

import argparse
import shutil
import subprocess
import sys
from html import escape
from pathlib import Path
from uuid import uuid4


OUTPUT = Path(__file__).parent
PAPER = "#f5f5f5"
INK = "#2d3142"
MUTED = "#4f5d75"
SOFT = "#5a6580"
RULE = "#bfc0c0"
ACCENT = "#bf4520"
TINT = "#f1e7e4"


def rect(x, y, w, h, fill="#ffffff", stroke=RULE, rx=6, extra=""):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" {extra}/>' )


def text(x, y, value, css="node", anchor="start"):
    sizes = {"node": 18, "diagram-title": 40, "sub": 13, "tag": 11,
             "eyebrow": 11, "row-label": 11, "stage": 18,
             "arrow-label": 11, "note": 15, "diagram-footer": 12}
    return (f'<text x="{x}" y="{y}" class="{css}" font-size="{sizes[css]}" '
            f'text-anchor="{anchor}">{escape(value)}</text>')


def cell(x, y, title, subtitle=None, focal=False, data=""):
    fill = TINT if focal else "#ffffff"
    stroke = ACCENT if focal else RULE
    return "\n".join([
        rect(x, y, 208, 80, fill, stroke, 6, data),
        text(x + 104, y + (36 if subtitle else 46), title, anchor="middle"),
        text(x + 104, y + 58, subtitle, "sub", "middle") if subtitle else "",
    ])


def step(x, y, width, tag, title, subtitle, focal=False):
    fill = TINT if focal else "#ffffff"
    stroke = ACCENT if focal else RULE
    return "\n".join([
        rect(x, y, width, 96, PAPER, "none"),
        rect(x, y, width, 96, fill, stroke),
        rect(x + 12, y + 8, 68, 18, PAPER, stroke, 2),
        text(x + 46, y + 21, tag, "tag", "middle"),
        text(x + 16, y + 54, title),
        text(x + 16, y + 78, subtitle, "sub"),
    ])


def arrow(d, accent=False, dashed=False):
    color = ACCENT if accent else MUTED
    marker = "arrow-accent" if accent else "arrow"
    dash = 'stroke-dasharray="5,4"' if dashed else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" marker-end="url(#{marker})" {dash}/>'


def label(x, y, width, value):
    return "\n".join([
        rect(x, y, width, 16, PAPER, "none", 2),
        text(x + width / 2, y + 12, value, "arrow-label", "middle"),
    ])


def overview():
    """Current browser, server, and workspace paths in one architecture view."""
    out = [
        text(48, 48, "DOCUMENT INTELLIGENCE  /  CURRENT LOCAL PROTOTYPE", "eyebrow"),
        text(48, 98, "How the system works", "diagram-title"),
        text(48, 128, "One temporary workspace connects uploaded sources, questions, and inspectable results.", "note"),
        rect(48, 176, 262, 374, PAPER, RULE, 8),
        rect(352, 176, 574, 374, PAPER, RULE, 8),
        rect(968, 176, 264, 374, PAPER, RULE, 8),
        rect(64, 168, 122, 18, PAPER, "none", 2),
        rect(368, 168, 162, 18, PAPER, "none", 2),
        rect(984, 168, 152, 18, PAPER, "none", 2),
        text(72, 182, "VISITOR + UI", "eyebrow"),
        text(376, 182, "NEXT.JS SERVER", "eyebrow"),
        text(992, 182, "LOCAL WORKSPACE", "eyebrow"),
        arrow("M 286 282 H 386"),
        arrow("M 600 282 H 686", accent=True),
        arrow("M 900 282 H 990", accent=True),
        arrow("M 286 422 H 386"),
        arrow("M 600 422 H 686", accent=True),
        cell(68, 242, "Upload files", "PDF, DOCX, TXT, MD"),
        cell(68, 382, "Ask in ES / EN", "question + locale"),
        cell(386, 242, "Extract text", "validate + chunk"),
        cell(686, 242, "Save sources", "files + passage IDs", True),
        cell(386, 382, "Find passages", "words + local vectors"),
        cell(686, 382, "Build result", "Groq + ID checks"),
        cell(990, 242, "Files + passages", "optional vector index"),
        cell(990, 382, "Question history", "saved questions"),
        text(68, 510, "Inspect sources; delete.", "note"),
        text(374, 510, "Only the server reads files or calls Groq.", "note"),
        '<line x1="48" y1="584" x2="1232" y2="584" stroke="#bfc0c0"/>',
        text(48, 614, "RESULT IN THE UI", "eyebrow"),
        text(244, 614, "Cited answer + sources, evidence-only passages (no key), or insufficient evidence.", "note"),
        text(48, 644, "Groq may add separate uncited general text after abstention; invalid responses show an error.", "diagram-footer"),
        '<line x1="48" y1="668" x2="1232" y2="668" stroke="#bfc0c0"/>',
        text(48, 696, "Manual deletion removes local files, passages, vectors, and questions; expiry is enforced on access.", "diagram-footer"),
    ]
    return "\n".join(out)


def evidence_flow():
    out = [
        text(80, 104, "01  FILE TO PASSAGES", "eyebrow"),
        text(80, 336, "02  QUESTION TO RESULT", "eyebrow"),
        arrow("M 280 220 H 340"),
        arrow("M 540 220 H 600", accent=True),
        arrow("M 280 448 H 340"),
        arrow("M 680 276 V 336 Q 680 344 672 344 H 448 Q 440 344 440 352 V 408"),
        label(696, 296, 72, "SEARCH"),
        arrow("M 540 448 H 600", accent=True),
        arrow("M 840 448 H 960", dashed=True),
        label(854, 424, 88, "CITATION"),
        arrow("M 840 232 H 1062 Q 1070 232 1070 240 V 408", dashed=True),
        label(942, 208, 96, "SOURCE ID"),
        step(80, 180, 200, "FILE", "Uploaded file", "PDF / DOCX / TXT / MD"),
        step(340, 180, 200, "PARSE", "Parse file", "validate; extract text"),
        step(600, 180, 240, "SOURCE", "Passages + optional index", "IDs; offsets; optional vectors", True),
        step(80, 408, 200, "INPUT", "Ask in ES / EN", "question + locale"),
        step(340, 408, 200, "SEARCH", "Select evidence", "hybrid / lexical fallback"),
        step(600, 408, 240, "RESULT", "Documentary result", "answer / evidence / abstain"),
        step(960, 408, 220, "UI", "Inspect source", "passage + original file"),
        '<line x1="80" y1="540" x2="1200" y2="540" stroke="#bfc0c0"/>',
        text(80, 574, "Overview questions sample passages; optional Groq rewrite sees only question and locale.", "note"),
        text(80, 602, "A passage ID links a claim to an existing source; semantic support still needs evaluation.", "note"),
        '<line x1="40" y1="644" x2="1240" y2="644" stroke="#bfc0c0"/>',
        text(40, 668, "DATA LINEAGE", "eyebrow"),
        text(252, 668, "Dashed paths are used when a source is available for inspection.", "diagram-footer"),
    ]
    return "\n".join(out)


def hybrid_retrieval():
    out = [
        text(48, 48, "DOCUMENT INTELLIGENCE  /  CURRENT LOCAL PROTOTYPE", "eyebrow"),
        text(48, 98, "Hybrid retrieval", "diagram-title"),
        text(48, 128, "Two local rankings select source passages for an optional documentary answer", "note"),
        rect(48, 176, 1184, 300, PAPER, RULE, 8),
        rect(72, 168, 152, 18, PAPER, "none", 2),
        text(80, 182, "QUESTION PATH", "eyebrow"),
        arrow("M 240 312 H 280 Q 288 312 288 304 V 274 Q 288 266 296 266 H 336"),
        arrow("M 240 344 H 280 Q 288 344 288 352 V 396 Q 288 404 296 404 H 336", accent=True),
        arrow("M 536 266 H 596 Q 604 266 604 274 V 296 Q 604 304 612 304 H 656"),
        arrow("M 536 404 H 596 Q 604 404 604 396 V 352 Q 604 344 612 344 H 656", accent=True),
        arrow("M 856 328 H 976", accent=True),
        step(64, 280, 176, "INPUT", "Question", "locale: es / en"),
        step(336, 218, 200, "WORDS", "Lexical ranking", "text + rewrites"),
        step(336, 356, 200, "MEANING", "Semantic ranking", "query + vectors", True),
        step(656, 280, 200, "FUSION", "Merge rankings", "reciprocal rank"),
        step(976, 280, 224, "EVIDENCE", "Top 5 passages", "existing source IDs"),
        rect(48, 496, 1184, 140, PAPER, RULE, 8),
        rect(72, 488, 140, 18, PAPER, "none", 2),
        text(80, 502, "LOCAL DATA", "eyebrow"),
        arrow("M 284 568 H 336"),
        arrow("M 436 520 V 452", accent=True),
        step(64, 520, 220, "SOURCE", "Stored passages", "IDs + text offsets"),
        step(336, 520, 200, "INDEX", "Optional vectors", "pinned local model"),
        text(656, 548, "EMBEDDING FAILURE", "eyebrow"),
        text(656, 580, "Use lexical matches and label the fallback.", "note"),
        text(656, 608, "The embedding model runs on this server.", "note"),
        '<line x1="48" y1="668" x2="1232" y2="668" stroke="#bfc0c0"/>',
        text(48, 696, "Citations resolve to these passages; claim support still needs independent evaluation.", "diagram-footer"),
    ]
    return "\n".join(out)


def answer_modes():
    """Show the saved documentary status and the separate optional general text."""
    def diamond(cx, cy, title, subtitle):
        return "\n".join([
            f'<path d="M {cx} {cy - 54} L {cx + 84} {cy} L {cx} {cy + 54} L {cx - 84} {cy} Z" fill="#ffffff" stroke="{RULE}" stroke-width="2"/>',
            text(cx, cy - 4, title, "node", "middle"),
            text(cx, cy + 18, subtitle, "sub", "middle"),
        ])

    out = [
        text(48, 48, "DOCUMENT INTELLIGENCE  /  CURRENT LOCAL PROTOTYPE", "eyebrow"),
        text(48, 98, "What the answer can show", "diagram-title"),
        text(48, 128, "The documentary result is decided before any separate general text.", "note"),
        arrow("M 248 252 H 298"),
        arrow("M 466 252 H 558", accent=True),
        arrow("M 726 252 H 818", accent=True),
        arrow("M 986 252 H 1050", accent=True),
        arrow("M 382 306 V 424"),
        arrow("M 642 306 V 424"),
        arrow("M 902 306 V 424"),
        label(476, 226, 72, "YES"),
        label(736, 226, 72, "YES"),
        label(990, 226, 52, "YES"),
        label(398, 354, 48, "NO"),
        label(658, 354, 48, "NO"),
        label(918, 354, 48, "NO"),
        step(48, 204, 200, "INPUT", "Question", "retrieve up to 5 passages"),
        diamond(382, 252, "Passages?", "selected locally"),
        diamond(642, 252, "Groq key?", "configured"),
        diamond(902, 252, "Answered?", "model status"),
        step(1050, 204, 182, "ANSWER", "Cited claims", "validated IDs", True),
        step(266, 424, 232, "LIMIT", "Insufficient evidence", "no passages selected"),
        step(526, 424, 232, "LOCAL", "Evidence only", "passages; no AI answer"),
        step(786, 424, 232, "LIMIT", "Insufficient evidence", "model abstains"),
        rect(48, 556, 1184, 92, TINT, RULE, 6),
        text(68, 584, "SEPARATE GENERAL TEXT", "eyebrow"),
        text(68, 610, "With a key and insufficient evidence: a narrow concept explanation or fixed verification limit may appear.", "note"),
        text(68, 632, "It has no document citations. If this optional step fails, the documentary limit remains.", "diagram-footer"),
        '<line x1="48" y1="668" x2="1232" y2="668" stroke="#bfc0c0"/>',
        text(48, 696, "A valid passage ID proves existence, not semantic support; provider or validation errors show an error instead.", "diagram-footer"),
    ]
    return "\n".join(out)


def html_page(slug, title, description, drawing):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(title)} · Document Intelligence</title>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; padding: 24px; background: {PAPER}; color: {INK}; font-family: Geist, system-ui, sans-serif; }}
    main {{ max-width: 1280px; margin: 0 auto; }}
    h1 {{ margin: 0 0 24px; font: 400 28px 'Instrument Serif', Georgia, serif; }}
    .diagram-container {{ width: 100%; overflow-x: auto; }}
    svg {{ display: block; width: 100%; min-width: 1280px; height: auto; }}
    .node {{ fill: {INK}; font: 600 18px Geist, system-ui, sans-serif; }}
    .diagram-title {{ fill: {INK}; font: 400 40px 'Instrument Serif', Georgia, serif; }}
    .sub {{ fill: {SOFT}; font: 400 13px 'Geist Mono', monospace; }}
    .tag, .eyebrow, .row-label {{ fill: {MUTED}; font: 500 11px 'Geist Mono', monospace; letter-spacing: .10em; }}
    .stage {{ fill: {INK}; font: 600 18px Geist, system-ui, sans-serif; }}
    .arrow-label {{ fill: {MUTED}; font: 400 11px 'Geist Mono', monospace; letter-spacing: .06em; }}
    .note {{ fill: {MUTED}; font: 400 15px Geist, system-ui, sans-serif; }}
    .diagram-footer {{ fill: {MUTED}; font: 400 12px 'Geist Mono', monospace; }}
    @media print {{ body {{ padding: 0; }} .diagram-container {{ overflow-x: visible; }} svg {{ min-width: 0; }} }}
  </style>
</head>
<body><main>
  <h1>{escape(title)}</h1>
  <div class="diagram-container"><svg width="1920" height="1080" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Arial, sans-serif" aria-labelledby="{slug}-title {slug}-desc">
    <title id="{slug}-title">{escape(title)}</title>
    <desc id="{slug}-desc">{escape(description)}</desc>
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="{MUTED}"/></marker>
      <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="{ACCENT}"/></marker>
      <marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#2e5aa8"/></marker>
    </defs>
    <rect width="1280" height="720" fill="{PAPER}"/>
    {drawing}
  </svg></div>
</main></body>
</html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exporter", type=Path, default=Path.home() / ".agents/skills/diagram-design/scripts/export_svg.py")
    args = parser.parse_args()
    if not args.exporter.is_file():
        parser.error(f"diagram-design SVG exporter not found: {args.exporter}")
    checker = args.exporter.with_name("self_check.py")
    pages = [
        ("overview", "How the system works", "Browser actions reach the Next.js server, which extracts and saves sources, retrieves passages, optionally calls Groq, and returns inspectable results from a temporary local workspace.", overview()),
        ("sources", "From uploaded file to inspectable source", "Files become passages; questions select passages for a documentary result whose source can be inspected.", evidence_flow()),
        ("search", "Hybrid retrieval", "A question ranks local passages by words and multilingual embeddings, fuses the two lists, and selects up to five source passages; lexical fallback handles embedding failure.", hybrid_retrieval()),
        ("answers", "Document answer modes", "The question route distinguishes cited documentary claims, local evidence-only passages, and insufficient evidence. With Groq configured, an abstention may also show separately labeled general text or a fixed verification limit without document citations.", answer_modes()),
    ]
    source_dir = OUTPUT / f".diagram-build-{uuid4().hex}"
    source_dir.mkdir()
    try:
        for slug, title, description, drawing in pages:
            source = source_dir / f"{slug}.html"
            source.write_text(html_page(slug, title, description, drawing), encoding="utf-8")
            subprocess.run([sys.executable, str(checker), str(source)], check=True)
            subprocess.run([sys.executable, str(args.exporter), str(source), str(OUTPUT / f"{slug}.svg"), "--system-fonts"], check=True)
    finally:
        if not source_dir.resolve().is_relative_to(OUTPUT.resolve()):
            raise RuntimeError("Temporary diagram files must stay inside system-design")
        shutil.rmtree(source_dir)


if __name__ == "__main__":
    main()
