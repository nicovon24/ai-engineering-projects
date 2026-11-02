# Hybrid retrieval task contracts

The canonical status is in [docs/specs/tasks.md](../../../specs/tasks.md). This file defines checks without repeating task status.

| Task | Requirement | Work | Verification |
| --- | --- | --- | --- |
| DI-010A | REQ-SEM-001, REQ-SEM-002 | Embed passage windows and questions locally; persist versioned indexes per workspace and delete them with sources. | Check vector dimensions, long-passage coverage, stale-index replacement, and cleanup. |
| DI-010B | REQ-SEM-003, REQ-SEM-004 | Fuse lexical and semantic candidates, use grounded nickname expansion, and disclose lexical fallback. | Compare synonym, nickname, unrelated, overview, and failed-model paths; inspect generated claim wording. |
| DI-010C | REQ-SEM-005 | Run narrow local evaluation and browser flow; record code review findings and documentation. | Compare labeled retrieval outcomes, inspect citations, run lint, typecheck, and build. |
