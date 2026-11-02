# Document Intelligence system design

Four diagrams explain the **current local prototype** from the visitor's action to the source and answer shown in the interface. Open an SVG directly in Orca, VS Code, or a browser. Each self-contained vector has a `1920 × 1080` intrinsic size and a `1280 × 720` viewBox, with large labels for direct preview.

| Diagram | What it answers |
| --- | --- |
| [Overview](overview.svg) | How do the browser, server, and local workspace handle upload, questions, results, source inspection, and deletion? |
| [Sources](sources.svg) | How does a file become passages, and how does a result lead back to the exact source? |
| [Search](search.svg) | How do lexical and local semantic rankings combine, and what happens if embeddings fail? |
| [Answers](answers.svg) | When does the visitor see cited claims, evidence-only passages, or an insufficient-evidence result? |

## Why these views

The overview shows the browser, Next.js server, and temporary local workspace in one view. It follows upload, extraction, storage, retrieval, optional answer generation, source inspection, and deletion. The source flow explains stable passage provenance and source inspection. Search explains the optional vector index, lexical and semantic ranking, fusion, and lexical fallback. Answers explains the distinct saved documentary results and the optional, separately labeled general text after abstention. The [conversational assistant proposal](../docs/features/03-answer-quality/02-conversational-assistant/proposal.md) describes future behavior in text. The current application has no MCP connection and does not let the model call tools; its server code orchestrates retrieval.

The former AI/MCP diagram repeated the current path while including an unimplemented MCP concept. The former improvements diagram repeated the written proposal. The detailed branches remain in [the project agent guide](../AGENTS.md). PostgreSQL, object storage, scheduled deletion, OCR, and global rate limiting are still planned or under evaluation.

## Current behavior and limits

- The local app accepts text PDFs, DOCX, TXT, and MD within its file and workspace limits. It stores original bytes, extracted passages, and optional versioned vectors in a session-scoped local workspace.
- A question carries the selected `es` or `en` locale. Specific questions fuse lexical and local multilingual semantic rankings; a narrow single-document overview path samples representative passages. An optional Groq rewrite receives only the question and locale. Up to five passages reach documentary generation. Embedding failures use labeled lexical fallback.
- Without a Groq key, the UI shows related passages as evidence only. With no selected passages or a documentary abstention, it records insufficient evidence. With a key, this result may also display a separately labeled explanation for a narrow concept or a fixed verification limit; neither has document citations.
- Cited passage IDs are checked against selected passages. This proves that the passage exists, not that it semantically supports the claim. Semantic support is still an evaluation task.
- Manual workspace deletion removes local data. Expired workspaces are removed on access; scheduled background deletion is not implemented.

## Regenerate

Run `py -3 build.py` from this directory. The generator creates temporary HTML, runs the `diagram-design` self-check, and exports the four SVG files. It expects the installed `diagram-design` skill at `~/.agents/skills/diagram-design`; pass `--exporter <path-to-export_svg.py>` when it lives elsewhere. The SVG files are the deliverables; no HTML pages are retained.
