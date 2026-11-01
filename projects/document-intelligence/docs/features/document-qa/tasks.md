# Document question answering task contracts

The only task-status table is [the project tracker](../../specs/tasks.md). The contracts below define acceptance and likely paths; they do not independently claim completion.

| ID | Requirement | Dependencies | File ownership when assigned | Verification and handoff |
| --- | --- | --- | --- | --- |
| DI-001 | REQ-001 | None | `src/app/workspace.tsx`, `src/app/actions.ts`, `src/lib/i18n.ts` | Check Spanish default, accessible switch, persistence, and explicit locale in the question request. |
| DI-002 | REQ-002, REQ-003 | DI-001 | `src/lib/parse-document.ts`, `src/app/actions.ts`, document download route | Exercise representative PDF, DOCX, TXT, MD, scanned, oversized, and over-page files; inspect page and offset provenance. |
| DI-003 | REQ-004, REQ-005 | DI-002 | `src/lib/retrieval.ts`, `src/lib/answer.ts`, question route | Show answerable and unanswerable outcomes, keyless evidence mode, valid citation IDs, and explicit locale. |
| DI-004 | REQ-006, REQ-007 | DI-002 | `src/lib/storage.ts`, `src/lib/types.ts`, question route, localized errors | Check quota reservation, failure release, document removal during a question, session isolation, and 24-hour access semantics. |
| DI-005 | REQ-008 | DI-002, DI-003 | `evals/` and its runner or documented manual protocol | Version the corpus and report each metric with case counts; include cross-language retrieval failures honestly. |
| DI-006 | REQ-005, REQ-008 | DI-005 | Answer validation and evaluation assets | Compare claim-to-passage semantic support and refusal behavior before claiming citation reliability. |
| DI-008 | REQ-009 | DI-003, DI-005 | Backend: `src/lib/retrieval.ts`, `src/lib/answer.ts`, `src/lib/types.ts`, question route; UI: `src/app/workspace.tsx`, `src/lib/i18n.ts`; coordinator owns shared docs. | Mock bounded rewrite and general-answer schemas; compare existing retrieval corpora; inspect UI in both locales with synthetic files; preserve no-key behavior and source citation checks. |

Assign paths exclusively before delegating work. The coordinator updates feature documents and the canonical tracker after receiving evidence. No task above authorizes public deployment.
