# Debate and Proposal Review CHECKLOG

This is a manual continuity note, not an automatic changelog or task board.

## Resume protocol

Before acting, compare this note with current code, Git state, [README.md](README.md), any feature requirements, and [docs/specs/tasks.md](docs/specs/tasks.md). The tracker owns task status. Correct stale notes only after checking evidence.

## Current state

- **Planned:** the project has an English plan and learning reference. No application, example proposal, evidence set, evaluation result, or deployment is claimed.

## Decisions

- Build a proposal-review tool with human final judgment, rather than a generic debate game.
- Score whether retrieved sources support factual claims separately from persuasive quality. A model judge's score is not proof of correctness.
- Keep this application independent from Document Intelligence and other projects when implemented.

## Recent changes

Keep at most **ten** dated entries, newest first. Older history belongs in Git and feature documents.

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-10-31 | Recorded the planned state and first three tasks for SDD continuity. | `README.md` and `docs/specs/tasks.md`; no application code exists. |

## Resume next

Start with DPR-001 in [the task tracker](docs/specs/tasks.md). Verify the source material and write feature acceptance before implementation.
