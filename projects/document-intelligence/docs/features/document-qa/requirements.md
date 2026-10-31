# Document question answering with inspectable sources

Status: In progress as a local prototype. Public readiness is outside the current acceptance.

## Route and objective

**SDD backfill with explicit contracts.** The app spans parsing, retrieval, AI output, storage, and privacy, so a design and task contract are warranted. This document records the existing product decisions and the gaps found by inspecting the code. It is not evidence that all requirements have passed evaluation.

The objective is to let a visitor upload a small set of personal documents, ask in Spanish or English, inspect the passages behind an answer, and receive an explicit insufficient-evidence result when support is missing.

## Scope and limits

- Initial files: text PDFs of at most 10 pages and 10 MB, plus DOCX, UTF-8 TXT, and MD under the same file-size limit. Up to three files per temporary workspace.
- Up to ten saved questions per workspace. Spanish is the initial UI language; users can switch to English. The selected locale is explicitly sent with a question.
- No-key local mode shows retrieved passages without claiming an AI answer. A server-held Groq key enables model-generated claims.
- Scanned PDFs are rejected with an explanation. OCR, embeddings, multi-agent workflows, and deployment are outside this feature.
- The public version's database, object storage, scheduled deletion, and global abuse controls are tracked separately as readiness work.

## Observable acceptance

- **REQ-001 — Language:** The interface starts in Spanish, switches accessibly to English, persists the choice, and sends `es` or `en` explicitly in every AI question. Generated claims use that language; direct quotations retain their source language.
- **REQ-002 — Intake:** The server accepts only supported files within limits, rejects textless or scanned PDFs clearly, and does not count a rejected file toward the three-file limit.
- **REQ-003 — Provenance:** Each accepted file produces inspectable passages with a document ID, stable passage ID, page number when available, and offsets into extracted text. A citation opens the passage and an authorized download of the original.
- **REQ-004 — Retrieval and abstention:** Questions search only the current workspace. No retrieved evidence yields an explicit insufficient-evidence result; no-key mode identifies related passages as evidence only.
- **REQ-005 — Generated answer:** The model receives only the question, selected locale, and retrieved passages. Each returned claim has cited passage IDs validated against those passages. Semantic support is evaluated separately and must not be inferred from ID validity.
- **REQ-006 — Bounded execution:** At most ten saved or in-flight questions occupy workspace slots. Failures release reservations; concurrent document removal cannot save an answer with broken citations.
- **REQ-007 — Temporary workspace:** An unguessable session token scopes reads and mutations; access expires 24 hours after the last successful upload or saved question. Manual deletion removes local workspace data. Background deletion is not part of the current local prototype.
- **REQ-008 — Evaluation:** Versioned cases include answerable, unanswerable, Spanish, English, cross-language, multi-file, text PDF, scanned PDF, and DOCX behavior. Report retrieval recall, citation resolution, semantic claim support, refusal, latency, and model cost separately, with corpus limitations stated.

## Tasks and evidence

Task IDs and status are maintained only in [the project tracker](../../specs/tasks.md). [Task contracts](tasks.md) give ownership and checks without copying status. [Design](design.md) records data boundaries and decisions; [review](review.md) records what was actually reviewed.

- Code evidence: `src/app/page.tsx`, `src/app/workspace.tsx`, `src/app/actions.ts`, `src/app/api/questions/route.ts`, `src/lib/parse-document.ts`, `src/lib/retrieval.ts`, `src/lib/answer.ts`, and `src/lib/storage.ts`.
- Observed checks: `npm run lint`, `npm run typecheck`, and `npm run build` exited 0 after the current answer and storage changes. A browser pass with a synthetic TXT showed upload, English locale persistence, a Groq answer, an inspectable source passage, and manual workspace deletion. Focused runners under `evals/` now cover synthetic PDF/DOCX parsing and retrieval, mocked answer output, and one-process storage reservations. These do not validate real-world parser compatibility, semantic citation support, actual model quality, or production concurrency.
- Git evidence at the last publication checkpoint: branch `master`, commit `dd2c094 Initialize AI engineering project workspace`. Compare the working tree with this commit before using it as implementation evidence.
- Next step: create the small labeled evaluation corpus and verify each supported format before deciding whether lexical retrieval is adequate for bilingual questions.
