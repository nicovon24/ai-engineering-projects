# Document Intelligence task status

This file is the **only task-status tracker** for this project. Read it with [CHECKLOG.md](../../CHECKLOG.md), the current code, Git state, and the linked feature requirements before acting. CHECKLOG summarizes recent context; it does not override this table.

| ID | Requirement | Dependency | Work | Status | Evidence and next check |
| --- | --- | --- | --- | --- | --- |
| DI-001 | [REQ-001](../features/document-qa/requirements.md) | None | Bilingual interface and explicit locale. | Implemented; manually checked | Browser showed Spanish initial UI, English switch, and English persistence after reload. |
| DI-002 | REQ-002, REQ-003 | DI-001 | File intake and inspectable provenance. | Implemented; synthetic formats checked | [Observed local format review](../../evals/format-verification.md): PDF 1/10 pages, DOCX, MD, TXT accepted; over-page, textless, oversized, unsupported, empty, invalid UTF-8 rejected. Real-world parser diversity remains unevaluated. |
| DI-003 | REQ-004, REQ-005 | DI-002 | Retrieval, evidence-only mode, and cited Groq answers. | In progress | Lexical retrieval and answer code exist; one synthetic TXT produced a cited Groq answer. No-key, refusal, cross-language, and semantic support need measured checks. |
| DI-004 | REQ-006, REQ-007 | DI-002 | Session boundaries, atomic quota reservation, stale-source rejection, retention. | Implemented; verification pending | Code inspection found reservations and source checks; lint, typecheck, and build passed. Concurrency and expiry behavior need direct verification. |
| DI-005 | REQ-008 | DI-002, DI-003 | Versioned labeled evaluation corpus and retrieval metrics. | In progress | [Synthetic baseline 1.0](../../evals/retrieval-baseline.md): 8 cases, expected-passage recall@5 5/6, empty result 2/2. Add permitted representative PDF/DOCX cases and precision/latency before completion. |
| DI-006 | REQ-005, REQ-008 | DI-005 | Semantic citation support, refusal, and bilingual model evaluation. | Planned | Score claim support separately from citation ID resolution; record case count, latency, and cost. |
| PUB-001 | [REQ-P001](../features/public-demo-readiness/requirements.md) | DI-005 | Durable database and original-file storage. | Planned | Choose provider and migration contract; preserve keyless local setup. |
| PUB-002 | REQ-P002 | PUB-001 | Scheduled expiry and complete deletion. | Planned | Demonstrate deletion without a visitor request and include derived data. |
| PUB-003 | REQ-P003, REQ-P004 | PUB-001 | Global limits, authorization review, and privacy disclosure. | Planned | Verify cross-instance quotas and workspace isolation before public access. |
| PUB-004 | REQ-P005 | DI-006, PUB-001, PUB-002, PUB-003 | Public readiness review. | Planned | Independent review of exact code and observed evaluation results; no deployment is part of this task. |

Next actionable task: **DI-005** representative evaluation corpus. DI-002 has synthetic format evidence; include representative real-world documents before making a broad compatibility claim. Update this table only after checking code and observed evidence.
# UI V2

| ID | Status | Requirement | Next action |
| --- | --- | --- | --- |
| UI-001 | Complete for local prototype | REQ-UI-001–007 | [Independent review](../features/workspace-ui-v2/review.md) found no remaining blocker after corrections; lint, typecheck, build, and targeted Playwright checks passed. |
