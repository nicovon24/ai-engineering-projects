# Document Intelligence CHECKLOG

This is a manual continuity note for the local prototype. It records recent changes and decisions; it does not run checks or own task status.

## Resume protocol

Before acting, compare this note with the current code, Git state, [README.md](README.md), [feature requirements](docs/features/document-qa/requirements.md), and [docs/specs/tasks.md](docs/specs/tasks.md). The code shows what exists; the task tracker owns task status. Resolve differences before implementing from this summary.

## Current state

- **In progress:** an independent local Next.js application exists with Spanish and English UI, temporary session-scoped files, lexical retrieval, optional server-side Groq answers, inspectable passages, and manual deletion.
- **Verified narrowly:** synthetic PDF (1 and 10 pages), DOCX, MD, and TXT intake plus representative rejection paths; a synthetic Groq answer with an inspectable PDF citation and authorized original download; desktop/mobile light/dark UI and language persistence. Lint, typecheck, and build passed after the UI implementation.
- **Not verified or implemented:** broad real-world PDF/DOCX compatibility, semantic claim support, representative parsed-document evaluation, scheduled background deletion, global abuse controls, and production database/object storage. This is not a public-ready demo.

## Decisions

- The first version accepts up to three supported files (10 MB each; text PDFs up to 10 pages) and ten questions per workspace. Scanned PDFs are declined until OCR exists.
- Spanish is the initial UI locale; the selected `es` or `en` is passed explicitly to Groq. No-key mode displays evidence rather than an AI answer.
- Source documents, passages, conversation history, and in-flight question reservations have separate roles. Passage-ID checks establish structural citation validity only.
- Local `.data/` storage keeps development keyless. PostgreSQL plus object storage is the current public-readiness candidate, not an implemented dependency.
- Access expires 24 hours after the last successful upload or saved question. Reads and downloads do not extend it; automatic background deletion is pending.

## Recent changes

Keep at most **ten** dated entries, newest first. Older details belong in Git and feature documents.

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-10-31 | Redesigned the document workspace with local shadcn/ui controls, responsive conversation and source regions, translated file picker, and persistent light/dark themes. | `src/app/`; Playwright CLI at 1280, 390, and 320 px; lint, typecheck, build passed; independent review found no remaining UI-001 blocker. |
| 2026-10-31 | Verified synthetic intake and provenance cases, including the 10-page boundary and rejected inputs. | `evals/format-verification.md`; Playwright CLI and local workspace metadata. |
| 2026-10-31 | Added a versioned, keyless lexical retrieval baseline and recorded its cross-language failure. | `evals/retrieval-cases.json`, `evals/run-retrieval.mjs`, `evals/retrieval-baseline.md`; 8 synthetic cases, 5/6 expected-passage recall@5. |
| 2026-10-31 | Recorded SDD requirements, design, task status, and public-readiness acceptance. | `docs/features/`, `docs/specs/tasks.md`; compare with code before trusting status. |
| 2026-10-31 | Added atomic question reservations and rejected answers whose source documents changed mid-request. | `src/lib/storage.ts`, question route; lint, typecheck, and build exited 0. Concurrency checks remain pending. |
| 2026-10-31 | Corrected the Groq output-status instruction after a synthetic response used `ok` instead of the required `answered`. | `src/lib/answer.ts`; one subsequent synthetic TXT browser flow returned a cited answer. |
| 2026-10-31 | Added the bilingual app shell, local intake, lexical retrieval, source panel, and manual deletion. | `src/app/`, `src/lib/`; the repository files are untracked, so the initial Git commit is not evidence of implementation. |

## Resume next

1. Continue DI-005 in [the task tracker](docs/specs/tasks.md): add permitted representative parsed documents and evaluate precision, latency, and answer support beyond the current synthetic baseline.
2. Recheck real-world PDF/DOCX layouts and scanned-image rejection before claiming broad format compatibility.
3. Update this note only after a meaningful, observed checkpoint.
