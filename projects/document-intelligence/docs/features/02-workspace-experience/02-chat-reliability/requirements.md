# Chat reliability review

## Objective and scope

Review and repair the existing local chat and answer pipeline before a Git publication checkpoint. Keep the bounded document Q&A contract, bilingual UI, chronological history, viewport layout, and source provenance. This is a focused delegated review and repair; no deployment, provider migration, conversational memory, or streaming is included.

## Acceptance

- **REQ-CHAT-001:** Submission immediately displays the pending question in the conversation. A successful saved record appears without waiting for a route refresh, appears only once after reconciliation, and updates the question allowance. Failed submission preserves the draft and shows a localized error.
- **REQ-CHAT-002:** New pending and completed messages remain visible at the bottom. Selecting another source starts its passage at the top, including independently scrolling source panels and quotations.
- **REQ-CHAT-003:** Same-tab document mutations, locale changes, and question requests cannot overlap in conflicting ways. Server-side reservation and stale-source checks remain authoritative for other tabs.
- **REQ-CHAT-004:** Rejected upload, removal, workspace deletion, or locale RPCs show localized recoverable feedback and release the busy state.
- **REQ-CHAT-005:** General explanations of allowed concepts may use ordinary terms such as document or file. Actual claims of access to uploaded sources, source attribution, personal facts, and current-data claims still receive the existing safe boundary behavior. Documentary citation validation is preserved.

## Verification

Use existing contract, bilingual fallback, retrieval, and storage checks; add regression cases for confirmed answer faults. Verify chat success, latency, error recovery, sources, and responsive layout through Playwright CLI with synthetic files and a local provider stub. No user documents or live provider requests are needed. Run lint, typecheck, production build, and an independent review of the final repairs.

Task status is maintained in [the canonical tracker](../../../specs/tasks.md). Observed findings, commands, limitations, and requested versus runtime-confirmed agent profiles are recorded in [review.md](review.md).
