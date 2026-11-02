"""Build the current Document Intelligence service diagrams as SVG files."""

import argparse
import subprocess
import sys
from html import escape
from pathlib import Path
from tempfile import TemporaryDirectory


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


def blueprint():
    stages = [
        ("UPLOAD", "Upload a file", "File listed", "Parse + index", "files; passages; vectors"),
        ("ASK", "Ask in ES / EN", "Mode + quota", "Reserve + retrieve", "lexical + semantic"),
        ("REVIEW", "Read result", "Result shown", "Generate + check", "cited IDs validated"),
        ("INSPECT", "Open a source", "Source panel", "Authorize source", "exact passage + file"),
        ("DELETE", "Delete workspace", "Workspace cleared", "Delete local data", "files + JSON + vectors"),
    ]
    out = [
        text(96, 84, "CURRENT LOCAL PROTOTYPE", "eyebrow"),
        text(88, 222, "VISITOR", "row-label", "end"),
        text(88, 334, "VISIBLE UI", "row-label", "end"),
        text(88, 446, "SERVER", "row-label", "end"),
        '<line x1="96" y1="268" x2="1200" y2="268" stroke="#bfc0c0" data-role="interaction"/>',
        '<line x1="96" y1="376" x2="1200" y2="376" stroke="rgba(45,49,66,0.55)" stroke-width="2" data-role="visibility"/>',
    ]
    for i, (stage, customer, front, back, sub) in enumerate(stages):
        x = 96 + i * 224
        stage_id = stage.lower()
        out.extend([
            rect(x, 104, 208, 48, PAPER, RULE, 2, f'data-stage="{stage_id}"'),
            text(x + 104, 134, f"0{i + 1}  {stage}", "stage", "middle"),
            f'<g data-layer="customer">{cell(x, 176, customer, data=f"data-stage={chr(34)}{stage_id}{chr(34)} data-name={chr(34)}{escape(customer)}{chr(34)}")}</g>',
            f'<g data-layer="frontstage">{cell(x, 288, front, data=f"data-stage={chr(34)}{stage_id}{chr(34)} data-name={chr(34)}{escape(front)}{chr(34)}")}</g>',
            f'<g data-layer="backstage">{cell(x, 400, back, sub, i == 2, data=f"data-stage={chr(34)}{stage_id}{chr(34)} data-name={chr(34)}{escape(back)}{chr(34)}" + (" data-focal=\"true\"" if i == 2 else ""))}</g>',
        ])
    out.extend([
        '<line x1="96" y1="528" x2="1200" y2="528" stroke="#bfc0c0"/>',
        text(96, 558, "Above the line: what the visitor sees. Below: server work for the same action.", "note"),
        text(96, 586, "No key: evidence only. No supporting passage: insufficient evidence. Deletion removes the local workspace.", "note"),
        '<line x1="40" y1="644" x2="1240" y2="644" stroke="#bfc0c0"/>',
        text(40, 668, "SERVICE BLUEPRINT", "eyebrow"),
        text(252, 668, "Five visible actions; five corresponding server operations.", "diagram-footer"),
    ])
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
        step(600, 180, 240, "SOURCE", "Passages + index", "IDs; offsets; vectors", True),
        step(80, 408, 200, "INPUT", "Ask in ES / EN", "question + locale"),
        step(340, 408, 200, "SEARCH", "Select evidence", "hybrid / overview"),
        step(600, 408, 240, "RESULT", "Documentary result", "answer / evidence / abstain"),
        step(960, 408, 220, "UI", "Inspect source", "passage + original file"),
        '<line x1="80" y1="540" x2="1200" y2="540" stroke="#bfc0c0"/>',
        text(80, 574, "Optional Groq rewrite sees the question and locale; generation sees up to five selected passages.", "note"),
        text(80, 602, "A passage ID links a claim to an existing source; semantic support still needs evaluation.", "note"),
        '<line x1="40" y1="644" x2="1240" y2="644" stroke="#bfc0c0"/>',
        text(40, 668, "DATA LINEAGE", "eyebrow"),
        text(252, 668, "Dashed paths are used when a source is available for inspection.", "diagram-footer"),
    ]
    return "\n".join(out)


def ai_architecture():
    out = [
        text(48, 48, "DOCUMENT INTELLIGENCE  /  CURRENT LOCAL PROTOTYPE", "eyebrow"),
        text(48, 98, "AI + RAG architecture", "diagram-title"),
        text(48, 128, "What runs today, and where tools and MCP would fit", "note"),
        rect(48, 176, 1184, 360, PAPER, RULE, 8),
        rect(72, 168, 128, 18, PAPER, "none", 2),
        text(80, 182, "CURRENT APP", "eyebrow"),
        arrow("M 252 268 H 300"),
        arrow("M 500 268 H 548", accent=True),
        arrow("M 748 268 H 796", accent=True),
        arrow("M 996 268 H 1044"),
        arrow("M 420 316 V 336 Q 420 344 428 344 H 592 Q 600 344 600 352 V 372"),
        arrow("M 700 372 V 316", accent=True),
        arrow("M 720 316 V 336 Q 720 344 728 344 H 1128 Q 1136 344 1136 336 V 316", dashed=True),
        text(900, 336, "NO-KEY PATH", "arrow-label", "middle"),
        step(72, 220, 180, "INPUT", "Web UI", "upload; ask ES/EN"),
        step(300, 220, 200, "CONTROL", "App server", "parse; quota; validate"),
        step(548, 220, 200, "RAG", "Hybrid search", "lexical + semantic", True),
        step(796, 220, 200, "MODEL", "Groq LLM", "context to JSON claims"),
        step(1044, 220, 180, "OUTPUT", "Result in UI", "server-checked IDs"),
        step(548, 372, 200, "DATA", "Local workspace", "files; passages; vectors"),
        text(80, 494, "RAG selects file passages; Groq sees up to five. Rewrite sees only question + locale.", "note"),
        text(80, 518, "Groq returns to the server for citation-ID checks. No key: evidence only. No support: abstain.", "note"),
        rect(48, 560, 1184, 112, PAPER, RULE, 8, 'stroke-dasharray="5,4"'),
        rect(72, 552, 232, 18, PAPER, "none", 2),
        text(80, 566, "CONCEPTUAL  /  NOT WIRED", "eyebrow"),
        arrow("M 560 608 H 720", dashed=True),
        arrow("M 720 632 H 560", dashed=True),
        text(640, 598, "MCP TOOL CALL", "arrow-label", "middle"),
        text(640, 654, "TOOL RESULT", "arrow-label", "middle"),
        rect(80, 584, 480, 64),
        text(96, 612, "AI app / MCP client"),
        text(96, 636, "model chooses; app calls the tool", "sub"),
        rect(720, 584, 480, 64),
        text(736, 612, "MCP server + tools"),
        text(736, 636, "exposes operations and resources", "sub"),
        text(48, 700, "Today, server code orchestrates retrieval. The model does not invoke tools; there is no MCP connection.", "diagram-footer"),
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
        step(336, 520, 200, "INDEX", "Versioned vectors", "pinned local model"),
        text(656, 548, "EMBEDDING FAILURE", "eyebrow"),
        text(656, 580, "Use lexical matches and label the fallback.", "note"),
        text(656, 608, "The embedding model runs on this server.", "note"),
        '<line x1="48" y1="668" x2="1232" y2="668" stroke="#bfc0c0"/>',
        text(48, 696, "Citations resolve to these passages; claim support still needs independent evaluation.", "diagram-footer"),
    ]
    return "\n".join(out)


def improvements():
    out = [
        text(48, 48, "DOCUMENT INTELLIGENCE  /  PROPOSAL · NOT IMPLEMENTED", "eyebrow"),
        text(48, 98, "A more capable chat", "diagram-title"),
        text(48, 128, "Resolve follow-ups, choose sources, and verify each answer against its evidence", "note"),
        rect(48, 176, 1184, 274, PAPER, RULE, 8),
        rect(72, 168, 186, 18, PAPER, "none", 2),
        text(80, 182, "PROPOSED ANSWER PATH", "eyebrow"),
        arrow("M 272 268 H 304"),
        arrow("M 512 268 H 544", accent=True),
        arrow("M 752 268 H 784"),
        arrow("M 992 268 H 1024"),
        step(64, 220, 208, "ASK", "User question", "ES / EN; follow-up"),
        step(304, 220, 208, "CONTEXT", "Resolve context", "standalone question", True),
        step(544, 220, 208, "ROUTE", "Choose sources", "files / general / web"),
        step(784, 220, 208, "CHECK", "Verify claims", "support per statement"),
        step(1024, 220, 200, "ANSWER", "Show response", "clear source labels"),
        text(80, 352, "SOURCE LANES", "eyebrow"),
        rect(80, 370, 344, 52),
        text(96, 400, "Files · cited passages", "note"),
        rect(468, 370, 344, 52),
        text(484, 400, "General · labeled explanation", "note"),
        rect(856, 370, 344, 52),
        text(872, 400, "Web · linked current sources", "note"),
        rect(48, 488, 1184, 168, PAPER, RULE, 8),
        rect(72, 480, 174, 18, PAPER, "none", 2),
        text(80, 494, "DELIVERY ORDER", "eyebrow"),
        step(64, 524, 216, "A", "Evaluate cases", "ES/EN; false claims"),
        step(300, 524, 216, "B", "Resolve follow-ups", "context; no-file chat"),
        step(536, 524, 216, "C", "Check support", "evidence per claim"),
        step(772, 524, 216, "D", "Tune retrieval", "BM25; rerank trials"),
        step(1008, 524, 216, "E", "Add web sources", "links; freshness"),
        '<line x1="48" y1="676" x2="1232" y2="676" stroke="#bfc0c0"/>',
        text(48, 700, "Future work only. Adopt retrieval methods after measured gains; local changes need no new database.", "diagram-footer"),
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
        ("how-it-works", "How the document workspace works", "Five visitor actions align with the visible interface and the server work behind it.", blueprint()),
        ("workflow", "From uploaded file to inspectable source", "Files become passages; questions select passages for a documentary result whose source can be inspected.", evidence_flow()),
        ("ai", "AI + RAG architecture", "The current app retrieves local passages for optional Groq answers; tools and MCP are shown separately as an unimplemented concept.", ai_architecture()),
        ("hybrid-retrieval", "Hybrid retrieval", "A question ranks local passages by words and multilingual embeddings, fuses the two lists, and selects up to five source passages; lexical fallback handles embedding failure.", hybrid_retrieval()),
        ("improvements", "Proposed assistant improvements", "Proposed stages resolve conversational questions, route to document, general, or optional web sources, verify claim support, and deliver a source-labeled answer. The sequence is future work, not current behavior.", improvements()),
    ]
    with TemporaryDirectory(prefix=".diagram-build-", dir=OUTPUT) as temporary:
        source_dir = Path(temporary)
        if not source_dir.resolve().is_relative_to(OUTPUT.resolve()):
            raise RuntimeError("Temporary diagram files must stay inside system-design")
        for slug, title, description, drawing in pages:
            source = source_dir / f"{slug}.html"
            source.write_text(html_page(slug, title, description, drawing), encoding="utf-8")
            subprocess.run([sys.executable, str(checker), str(source)], check=True)
            subprocess.run([sys.executable, str(args.exporter), str(source), str(OUTPUT / f"{slug}.svg"), "--system-fonts"], check=True)


if __name__ == "__main__":
    main()
