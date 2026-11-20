# Repository Investigation Agent tasks

This is the project's canonical status summary. Detailed implementation steps and verification checks are in the active [OpenSpec task list](../../openspec/changes/repository-investigation-mvp/tasks.md). OpenSpec planning artifacts describe intended behavior, not implemented behavior.

| ID | Work | Status | Evidence or next check |
| --- | --- | --- | --- |
| RIA-001 | Define the local public-repository investigation and conversation-continuity MVP. | Complete (plan) | OpenSpec proposal, two capability specs, design, and tasks exist; strict validation and independent plan review completed on 2026-11-20. |
| RIA-002 | Implement and verify the MVP. | Complete (local MVP) | All 19 OpenSpec tasks are complete. 23 focused tests, typecheck, lint, build, and fixture browser flow passed on 2026-11-20. `scripts/check-flow.ts` verified live public-source reads, same-commit reuse, simulated changed source, and historical citations. Independent read-only review found three issues and one follow-up regression; all were fixed and re-reviewed with no remaining findings. Real provider answer quality and deployment remain outside this MVP. |
