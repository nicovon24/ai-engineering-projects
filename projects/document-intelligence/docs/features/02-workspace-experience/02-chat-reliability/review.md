# Chat reliability review — 2026-11-01

## Scope and conclusion

Reviewed the local prototype on `master`, starting from `03fbb03` plus the existing uncommitted viewport and diagram changes. The focused chat and general-answer repairs satisfy REQ-CHAT-001–005. This checkpoint is ready for a Git commit; no commit, push, or deployment was performed.

## Findings and repairs

| Finding | Repair and observed evidence |
| --- | --- |
| Successful question POST discarded its saved record and cleared the composer before the route refresh arrived. | Pending questions appear immediately; saved responses render locally, update the allowance, and reconcile by ID. Browser verification held the server-component refresh and confirmed a visible answer with no later duplicate. |
| A newly selected citation reused the previous source scroll offset. | Selecting a source resets both the panel and quotation scroll. Long passages were checked at 1024, 390, and 320 px. |
| Action transport rejection escaped localized feedback; question and mutation requests could overlap. | A shared operation guard prevents same-tab conflicts. Upload, removal, workspace deletion, and locale RPC failures show feedback and release the busy state. Failed questions retain their draft. |
| Ordinary document/file nouns incorrectly rejected valid general concept explanations. | Output filtering distinguishes domain nouns from explicit source attribution, while preserving the strict question boundary. Bilingual mock regressions cover retrieval, RAG, OCR, and JSON. |
| Some unsupported upload/source assertions passed the general filter. | Added focused attribution patterns and regression cases, including possessive PDF and bare/indefinite source nouns followed by assertion verbs. These checks remain heuristic. |
| Initial repair could revive a locally retained answer after another tab deleted a document. | Server acknowledgment prunes local copies; a change to the submitted document set invalidates remaining copies. A two-tab browser check retained the mounted draft while refreshing and confirmed history stayed cleared. |

## Verification observed

- `npm run lint`, `npm run typecheck`, and `npm run build`: exit 0 on the final source. The initial sandbox build failed to spawn a TypeScript worker (`EPERM`); the permitted local build succeeded.
- `node evals/bilingual-fallback-verification.mjs`: 47/47, including 20 additional regressions. The first valid-concept regression failed before the fix.
- `node evals/answer-contract-verification.mjs`: 19/19.
- `node evals/storage-verification.mjs`: 19/19.
- `node evals/run-retrieval.mjs`: existing eight-case baseline unchanged; recall@5 0.83, annotated precision 0.64, empty-result cases 2/2. The known keyless cross-language miss remains.
- Playwright CLI against the final production build on `127.0.0.1:3005`, with a synthetic local provider on `127.0.0.1:4015`: 33 assertions passed. No real provider calls or user documents were involved. The local provider produced deterministic responses; this is integration evidence, not model-quality evidence.

The browser checks covered pending/success with a delayed refresh, immediate quota updates, chronological retry, provider failure and invalid citation recovery, four action transport failures, manual reading position, source reset, viewport bounds at 1440×900, 1024×600, 390×600, and 320×600, explicit English locale on the question API, separate general output, and deletion from another tab. Desktop and 390×844 screenshots were visually inspected. Console network errors came from deliberately rejected requests. Test scripts and captures are local artifacts under the ignored `.playwright-cli/` folder.

To repeat the cross-tab regression: upload two synthetic files, ask about the first in tab A, allow its answer to refresh, remove the second file in tab B, then switch locale in tab A to refresh its server props without a full document reload. History must remain empty and the current draft must remain intact.

## Independent review and orchestration

The coordinator assigned bounded ownership and kept at most two subagents active. No worker delegated. Creation and final handoffs were observed for these runtime task paths:

| Task | Requested model / effort | Runtime-confirmed model / effort | Outcome |
| --- | --- | --- | --- |
| `/root/chat_audit` | `gpt-6-sol` / high | unconfirmed / unconfirmed | Initial findings, one reconciliation blocker, then approval of the corrected UI patch. |
| `/root/answer_audit` | `gpt-6-sol` / high | unconfirmed / unconfirmed | Initial findings, one attribution blocker, then approval; independently reran 47 fallback and 19 answer checks. |
| `/root/chat_fix` | `gpt-6-sol` / medium | unconfirmed / unconfirmed | Owned only workspace UI, CSS, and localized copy; lint and typecheck passed. |
| `/root/answer_fix` | `gpt-6-sol` / medium | unconfirmed / unconfirmed | Owned only answer filtering and the bilingual regression runner. |

The coordinator's exact model identity was not exposed. Final reviews examined the corrected working-tree files against the requirements in this folder; parent browser verification followed their approvals.

## Remaining limits

No broad semantic claim-support, refusal, or live bilingual model-quality evaluation is established by these checks. General-answer text filters cannot prove truth. Conversation history remains UI history rather than model context for follow-up pronouns. Streaming, background deletion, global abuse controls, production persistence, and public readiness remain outside this repair. DI-005 and DI-006 remain the next evaluation work.
