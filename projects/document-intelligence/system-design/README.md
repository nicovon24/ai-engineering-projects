# Document Intelligence system design

Four diagrams explain the **current local prototype** from the visitor's action to the source shown in the interface. A fifth diagram shows a **proposal that is not implemented**. Open an SVG directly in Orca, VS Code, or a browser. Each self-contained vector has a `1920 × 1080` intrinsic size and a `1280 × 720` viewBox, with large labels for direct preview.

| Diagram | What it answers |
| --- | --- |
| [How the workspace works](how-it-works.svg) | What does a visitor do at each stage, what appears in the interface, and what does the server do behind it? |
| [From uploaded file to inspectable source](workflow.svg) | How does a file become passages, how does a question select evidence, and how does a result lead back to the exact source? |
| [AI, RAG, tools, and MCP](ai.svg) | How are the UI, server, local passages, retrieval, and optional model connected? Where would MCP tools fit? |
| [Hybrid retrieval](hybrid-retrieval.svg) | How do lexical and local semantic rankings combine, and what happens if embeddings fail? |
| [Proposed improvements](improvements.svg) | How could conversational context, broader sources, claim checks, and later retrieval experiments extend the app? This view is proposed. |

## Why these views

The service blueprint gives the whole app flow: upload, ask, review, inspect, and delete. Its visibility line separates user actions and UI feedback from parsing, retrieval, validation, source access, and local deletion. The evidence flow explains stable passage provenance and source inspection. The AI architecture diagram shows the current RAG path and a separate conceptual MCP path. The hybrid retrieval diagram shows the two rankings, their fusion, the local vector index, and lexical fallback. The [conversational assistant proposal](../docs/features/03-answer-quality/02-conversational-assistant/proposal.md) owns the future behavior shown in `improvements.svg`. The current application has no MCP connection and does not let the model call tools; its server code orchestrates retrieval.

The previous generic component map, standalone intake path, question sequence, result-decision chart, and conceptual data model were removed from this folder. They repeated the implementation guide or described storage detail without clarifying the app's end-to-end behavior. The detailed branches remain in [the project agent guide](../AGENTS.md). A deployment diagram would imply infrastructure that does not exist yet; PostgreSQL, object storage, scheduled deletion, OCR, and global rate limiting are still planned or under evaluation.

## Current behavior and limits

- The local app accepts text PDFs, DOCX, TXT, and MD within its file and workspace limits. It stores original bytes, extracted passages, and optional versioned vectors in a session-scoped local workspace.
- A question carries the selected `es` or `en` locale. Specific questions fuse lexical and local multilingual semantic rankings; a narrow single-document overview path samples representative passages. An optional Groq rewrite receives only the question and locale. Up to five passages reach documentary generation. Embedding failures use labeled lexical fallback.
- Without a Groq key, the UI shows related passages as evidence only. Without supporting passages, it reports insufficient evidence. A separately labeled general response may be added for a narrow set of concepts when a key is configured.
- Cited passage IDs are checked against selected passages. This proves that the passage exists, not that it semantically supports the claim. Semantic support is still an evaluation task.
- Manual workspace deletion removes local data. Expired workspaces are removed on access; scheduled background deletion is not implemented.

## Regenerate

Run `py -3 build.py` from this directory. The generator creates temporary HTML, runs the `diagram-design` self-check, and exports the five SVG files. It expects the installed `diagram-design` skill at `~/.agents/skills/diagram-design`; pass `--exporter <path-to-export_svg.py>` when it lives elsewhere. The SVG files are the deliverables; no HTML pages are retained.
