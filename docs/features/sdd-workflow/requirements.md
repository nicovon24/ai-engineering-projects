# Repository SDD and CHECKLOG workflow

Status: Complete for the documentation workflow. Application features remain tracked separately.

## Route and objective

**SDD light.** This is a documentation and shared-instruction change with explicit acceptance, no application-code change, and a required independent review because root `AGENTS.md` is shared configuration. The coordinator wrote the documentation directly; no implementation worker was delegated for this feature.

The objective is to make project state recoverable without treating CHECKLOG as an automated or authoritative task board.

## Scope and limits

- Included: root workflow instructions and template; a CHECKLOG and canonical task tracker in each existing project; a feature specification for the active Document Intelligence application.
- Excluded: application behavior, new project applications, remotes, deployments, and automatic changelog generation.
- Only the three currently existing project directories are in scope. Future directories inherit the root rule when created.

## Observable acceptance

- **REQ-001:** Root `AGENTS.md` explains the resume order and distinguishes code evidence, canonical task status, feature documents, and CHECKLOG summaries.
- **REQ-002:** Each existing project has a root `CHECKLOG.md` with current state, decisions, at most ten dated recent changes, and an instruction to compare it with code and `docs/specs/tasks.md` before acting.
- **REQ-003:** Each existing project has `docs/specs/tasks.md`; Document Intelligence also has active feature requirements, design, and task contracts. Planned projects do not claim an implemented app.
- **REQ-004:** A read-only independent reviewer checks these documents against current code and requirements after the shared instructions are written. Requested model and runtime-confirmed model are recorded separately.

## Tasks, evidence, and next step

Task IDs and their only status column are in [the repository task tracker](../../specs/tasks.md). No application tests are part of this documentation feature.

- Git baseline observed: branch `master`, commit `14db3c4 Initial commit`. Current project files are untracked; that commit does not prove their content.
- Evidence to compare: root and project `AGENTS.md`, project READMEs, the active app's source, the three CHECKLOGs, and task trackers.
- Coordinator model requested by the SDD skill: `gpt-6-astra` medium. Main runtime model and effort: unconfirmed; this session does not expose a main-model selector.
- Independent documentation review: a read-only reviewer found one low-severity missing resume-order instruction. Root `AGENTS.md` was corrected and the reviewer re-reviewed that exact change; REQ-001 through REQ-004 now pass. See [review.md](review.md). This is not approval of application behavior.
- Next step: resume Document Intelligence task DI-002 from its canonical tracker, beginning with representative file-format verification.
