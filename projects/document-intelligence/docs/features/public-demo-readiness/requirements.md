# Public demo readiness

Status: Planned. No public deployment is authorized or claimed.

## Route and objective

**SDD light specification.** The public version changes persistence, retention, authorization, and abuse boundaries. This document records acceptance and dependencies before choosing a provider or editing deployment configuration. The current local prototype remains independently runnable without a database or API key.

## Scope and limits

- Included: durable workspace metadata and passage storage, original-file object storage, scheduled data deletion, global abuse controls, operational handling of provider limits, and truthful privacy disclosure.
- Excluded: brokerage or external account access, OCR, multi-agent orchestration, and a deployment action in this documentation task.

## Observable acceptance

- **REQ-P001:** A restart or multiple application instances cannot lose or split a visitor's workspace state. Metadata, passages, questions, and reservations are stored durably; originals live in object storage with workspace-scoped access.
- **REQ-P002:** Files and all derived application data are deleted on schedule after 24 hours from the last successful upload or saved question, whether or not the visitor returns. Manual deletion removes the same data promptly.
- **REQ-P003:** Per-workspace and global limits bound uploads, questions, provider calls, tokens, and storage. Parallel requests cannot bypass quotas across instances.
- **REQ-P004:** Every document read and mutation is authorized to the anonymous workspace. The UI accurately explains that selected passages are sent to Groq and distinguishes application retention from provider retention.
- **REQ-P005:** A versioned evaluation corpus and observed operational results justify public claims about citation support, refusal, bilingual behavior, latency, and cost. No reference repository's measurements are reused as this application's results.

## Tasks, evidence, and next step

Task status is maintained in [the project tracker](../../specs/tasks.md) under PUB-001 through PUB-004. The current code uses local `.data/workspaces/` storage, expiration on access, and per-workspace limits. These are evidence of a local prototype, not of public readiness.

- Initial architecture candidate: PostgreSQL for workspace metadata, passages, questions, and reservations; object storage for original files. The concrete provider and migration contract remain undecided.
- Next step: complete DI-005 and DI-006 evaluations, then specify the storage adapter and deletion job against REQ-P001 through REQ-P005. No deployment until all acceptance and required independent reviews are satisfied.
