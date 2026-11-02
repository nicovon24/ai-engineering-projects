# Document Intelligence CHECKLOG

This is a manual continuity note for the local prototype. It records recent changes and decisions; it does not run checks or own task status.

## Resume protocol

Before acting, compare this note with the current code, Git state, [README.md](README.md), the [numbered feature index](docs/features/README.md) and its relevant requirements, and [docs/specs/tasks.md](docs/specs/tasks.md). The code shows what exists; the task tracker owns task status. Resolve differences before implementing from this summary.

## Current state

- **In progress:** an independent local Next.js application exists with Spanish and English UI, temporary session-scoped files, hybrid lexical and local multilingual semantic retrieval, optional bounded Groq bilingual query rewrites, optional server-side Groq documentary answers and narrow general fallback, inspectable passages, and manual deletion.
- **Verified narrowly:** synthetic PDF (1 and 10 pages), DOCX, MD, and TXT intake plus representative rejection paths; one private real two-page PDF parsed and evaluated locally; pinned-model semantic calibration and a narrow private 6/6 answerable, 2/2 no-evidence checkpoint; a synthetic browser upload, synonym answer, nickname answer, and vector cleanup; generic English and Spanish overview questions retrieve sampled passages from a single document; 47 mocked bilingual fallback checks; 33 synthetic-provider chat/browser assertions; warm light/dark UI at desktop and mobile sizes.
- **Not verified or implemented:** broad real-world PDF/DOCX compatibility, semantic claim support, scheduled background deletion, global abuse controls, and production database/object storage. This is not a public-ready demo.

## Decisions

- The first version accepts up to three supported files (10 MB each; text PDFs up to 10 pages) and ten questions per workspace. Scanned PDFs are declined until OCR exists.
- Local passage and question embeddings use a pinned multilingual model with token-safe windows. Versioned vector indexes live inside the temporary workspace; missing or failed embeddings fall back to lexical retrieval. The initial similarity threshold is based on a small synthetic calibration, not a broad quality claim.
- With a key, Groq rewrites only the question and locale into bounded Spanish/English searches. Documentary answers receive selected passages. A separate general response is limited to a small explicit list of educational topics; semantic truth is not proven by its format or filters.
- Spanish is the initial UI locale; the selected `es` or `en` is passed explicitly to Groq. No-key mode displays evidence rather than an AI answer.
- Source documents, passages, conversation history, and in-flight question reservations have separate roles. Passage-ID checks establish structural citation validity only.
- Local `.data/` storage keeps development keyless. PostgreSQL plus object storage is the current public-readiness candidate, not an implemented dependency.
- Access expires 24 hours after the last successful upload or saved question. Reads and downloads do not extend it; automatic background deletion is pending.
- The warm orange visual foundation uses local semantic tokens and is documented in [DESIGN.md](DESIGN.md). Future projects may adopt its roles through the [portable guide](../../docs/visual-foundation.md) without sharing runtime code.

## Recent changes

Keep at most **ten** dated entries, newest first. Older details belong in Git and feature documents.

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-11-02 | Added a general current-system architecture view and renamed the four design files to overview, sources, search, and answers. | [System design](system-design/README.md); generator and SVG checks. |
| 2026-11-02 | Added the current answer-mode tree to distinguish cited claims, keyless passages, documentary abstention, and separately labeled general text. | [DI-012](docs/specs/tasks.md); question route and answer contract; generator, XML, SVG lint, local links, and browser rendering check. |
| 2026-11-02 | Kept three distinct current-system diagrams; removed the overlapping AI/MCP and proposed-improvements views, and clarified optional vectors and lexical fallback. | [DI-011](docs/specs/tasks.md), generator self-check, SVG export, XML and SVG lint. |
| 2026-11-01 | Grouped related feature plans into four numbered areas and preserved their implemented, proposed, and planned distinctions. | [Feature index](docs/features/README.md); local Markdown link audit. |
| 2026-11-01 | Recorded the proposed conversational assistant and its staged improvements without changing application behavior. | [Proposal](docs/features/03-answer-quality/02-conversational-assistant/proposal.md). |
| 2026-11-01 | Added local multilingual vector indexes, hybrid retrieval, bounded grounded-name search, and localized lexical fallback. | [DI-010 review](docs/features/03-answer-quality/01-semantic-retrieval/review.md): synthetic model calibration, private aggregate, browser flow, targeted checks, and independent review. |
| 2026-11-01 | Enlarged inputs, controls, and supporting text; introduced a warm orange palette, improved short-chat positioning, and documented a portable visual foundation. | [UI-003 review](docs/features/02-workspace-experience/03-visual-foundation/review.md): four viewport widths, both themes, synthetic upload and mocked chat, contrast calculations, lint, and build. |
| 2026-11-01 | Repaired pending and saved chat responses, action error recovery, source scrolling, cross-tab history reconciliation, and general-answer false rejections. | [DI-009 review](docs/features/02-workspace-experience/02-chat-reliability/review.md): two independent approvals; 47 fallback, 19 answer, 19 storage checks; 33 Playwright assertions; lint, typecheck, and production build passed. |
| 2026-11-01 | Bounded the workspace to the visible viewport and changed the chat to chronological messages with latest-message positioning. | [UI-002 review](docs/features/02-workspace-experience/01-workspace-ui/review.md): Playwright CLI at desktop, intermediate, and mobile sizes; independent source review; lint, typecheck, and design detector passed. |
| 2026-11-01 | Updated the visitor workflow, source lineage, and hybrid retrieval views with local vectors and lexical fallback. | [System design](system-design/README.md); `diagram-design` self-check, SVG export, and rendered visual review. |

## Resume next

1. Continue DI-005 in [the task tracker](docs/specs/tasks.md): broaden hybrid-versus-lexical evaluation with real documents and multi-file cases, obtain a permitted real DOCX, and evaluate semantic answer support separately in DI-006. Use the [conversational proposal](docs/features/03-answer-quality/02-conversational-assistant/proposal.md) if that future scope is selected; its stages are not implemented tasks.
2. Recheck real-world PDF/DOCX layouts and scanned-image rejection before claiming broad format compatibility.
3. Update this note only after a meaningful, observed checkpoint.
