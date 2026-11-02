# Feature plans

These plans are grouped by related work and numbered in the intended delivery order. Numbers are navigation aids, not task IDs or proof that a feature is complete. [The task tracker](../specs/tasks.md) is the only source of task status; the linked reviews record the scope of completed checks.

| Order | Related work | Documents | Current scope |
| --- | --- | --- | --- |
| 01 | Document Q&A foundation | [Requirements](01-document-qa/requirements.md), [design](01-document-qa/design.md), [review](01-document-qa/review.md) | Local prototype implemented; evaluation continues under DI-005 and DI-006. |
| 02.01 | Workspace interface | [Requirements](02-workspace-experience/01-workspace-ui/requirements.md), [design](02-workspace-experience/01-workspace-ui/design.md), [review](02-workspace-experience/01-workspace-ui/review.md) | Completed for the local prototype. |
| 02.02 | Chat reliability | [Requirements](02-workspace-experience/02-chat-reliability/requirements.md), [review](02-workspace-experience/02-chat-reliability/review.md) | Completed for the local prototype. |
| 02.03 | Visual foundation | [Requirements](02-workspace-experience/03-visual-foundation/requirements.md), [review](02-workspace-experience/03-visual-foundation/review.md) | Completed for the local prototype. |
| 03.01 | Semantic retrieval | [Requirements](03-answer-quality/01-semantic-retrieval/requirements.md), [design](03-answer-quality/01-semantic-retrieval/design.md), [review](03-answer-quality/01-semantic-retrieval/review.md) | Implemented locally with narrow evaluation; broader quality evaluation remains open. |
| 03.02 | Conversational assistant | [Proposal](03-answer-quality/02-conversational-assistant/proposal.md), [improvements diagram](../../system-design/improvements.svg) | Proposed stages only; no new assistant behavior is implemented by this plan. |
| 04 | Public readiness | [Requirements](04-public-readiness/requirements.md) | Planned; no public deployment is claimed. |

Within group 03, the conversational proposal builds on the existing retrieval path. Its delivery stages A–E describe future evaluation, contextual conversation, claim support, retrieval experiments, and optional web sources. Stage F depends on the separate public-readiness group. Implement these stages only after adding their accepted work to [the task tracker](../specs/tasks.md).
