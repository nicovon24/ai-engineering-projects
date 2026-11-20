# Repository Investigation Agent tasks

This is the project's canonical status summary. Detailed implementation steps and verification checks are in the active [OpenSpec task list](../../openspec/changes/repository-investigation-mvp/tasks.md). OpenSpec planning artifacts describe intended behavior, not implemented behavior.

| ID | Work | Status | Evidence or next check |
| --- | --- | --- | --- |
| RIA-001 | Define the local public-repository investigation and conversation-continuity MVP. | Complete (plan) | OpenSpec proposal, two capability specs, design, and tasks exist; strict validation and independent plan review completed on 2026-11-20. |
| RIA-002 | Implement and verify the MVP. | Complete (local MVP) | All 20 OpenSpec tasks are complete. The earlier implementation passed 23 focused tests, typecheck, lint, build, and fixture browser checks; `scripts/check-flow.ts` verified live public-source reads, same-commit reuse, simulated changed source, and historical citations. The Groq integration follows the workspace's `GROQ_API_KEY`, `GROQ_MODEL`, and `GROQ_BASE_URL` pattern with a project-local ignored key. A live function-selection request was accepted by Groq; GitHub then rate-limited the source read before a complete answer. |
