# Project CHECKLOG template

Copy this file to `projects/<project-name>/CHECKLOG.md` when a project directory is created. Replace every placeholder with verified facts. This file is a manual orientation note, not an automatic changelog or the source of task status.

## Resume protocol

Before acting, compare this note with the current code, Git state, project README, feature requirements, and `docs/specs/tasks.md`. The code shows implementation; the task tracker owns task status. If they differ, investigate and update this note after checking evidence.

## Current state

- Status: Planned | In progress | Complete.
- What exists: <verified files and behavior>.
- What remains: <important gaps without implied completion>.

## Decisions

- <Decision, reason, and whether it is implemented or planned.>

## Recent changes

Keep at most **ten** dated entries, newest first. Describe only observed changes and checks. Git and feature documents retain older history.

| Date | Change | Evidence |
| --- | --- | --- |
| YYYY-MM-DD | <What changed> | <Code, document, command, or review reference> |

## Resume next

1. Read `docs/specs/tasks.md` for the current task state.
2. Open the linked feature requirements and inspect the relevant code before editing.
3. Record verified outcomes here after a meaningful checkpoint.
