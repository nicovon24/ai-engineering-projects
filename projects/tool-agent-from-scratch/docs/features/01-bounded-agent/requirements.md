# Feature 01 — bounded local tool agent

**Status: Planned for the independent CLI.** These are acceptance targets, not observed behavior. The current implementation target is the [local web workspace](../02-web-workspace/requirements.md), which reuses the tool and loop contracts here. CLI-specific requirements remain future work.

## User story

As a learner, I want to run a small agent with two useful local tools and inspect every decision, so I can understand where planning ends, validated tool execution begins, and why a run stops.

## Observable requirements

| ID | Acceptance target |
| --- | --- |
| REQ-TA-001 | From this directory, a documented local command starts the CLI with no API key, network call, or dependency on another project. |
| REQ-TA-002 | The registry exposes exactly `search_notes(query: nonempty string, limit: integer 1..5)` and `read_note(note_id: allowlisted ID)`. Search returns IDs and bounded excerpts; read returns one note's ID, title, and content. Malformed or extra arguments are rejected before execution. |
| REQ-TA-003 | A planner receives the user request, selected locale, and prior bounded outcomes, then returns either a structured tool call or a final answer. A deterministic fixture planner can complete the documented demo question. |
| REQ-TA-004 | The loop allows at most four planner decisions total, including the final decision. It records `started`, `planning`, `validating`, `executing`, and one terminal state: `completed`, `rejected`, `tool_error`, or `step_limit`. No fifth decision or tool execution occurs. |
| REQ-TA-005 | Unknown tool names, invalid arguments, manifest misses, and tool exceptions stop safely with a typed error and visible stop reason; no arbitrary path or command reaches a tool. |
| REQ-TA-006 | Each run prints an ordered compact trace with decision number, state, tool name, validation/execution outcome, and stop reason. The trace omits full note bodies, full prompts, credentials, and sensitive argument values. |
| REQ-TA-007 | The CLI starts in Spanish, offers `--lang es|en`, persists an explicit selection in an ignored local settings file, and passes locale into planner requests. Final answers may cite only note IDs returned by `read_note` in that run; unsupported IDs are rejected. Source text is not translated. |
| REQ-TA-008 | The README names exact install/run commands and records observed success and failure cases only after implementation. A fixture-backed answer and trace can be reproduced offline. |

Displayed citations for REQ-TA-007 are rendered only from validated structured `note_ids`. The CLI rejects citation markup embedded in free-form answer text so unsupported inline IDs cannot bypass that check.

## First demo path

Bundle two short, original sample notes about a fictional project. Document one fixed question whose answer is in one note. The deterministic planner emits `search_notes`, uses an allowlisted returned note ID in `read_note`, then finalizes with that ID. The notes and question must be authored here; any imported material needs license and attribution review.

## Out of scope for this feature

Live model calls, arbitrary file access, shell or browser tools, writes, personal documents, long-term memory, and multi-agent orchestration.
