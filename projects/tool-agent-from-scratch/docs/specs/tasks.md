# Tool Agent from Scratch task status

This is the canonical tracker. Requirement IDs come from [core loop requirements](../features/01-bounded-agent/requirements.md) and [web workspace requirements](../features/02-web-workspace/requirements.md). No behavior is complete merely because files exist.

| ID | Requirements | Work | Status | Acceptance evidence needed |
| --- | --- | --- | --- | --- |
| WEB-001 | REQ-TA-002–005, 007; REQ-TA-WEB-002, 003 | Implement fictional note fixtures, exact-schema read-only tool registry, deterministic planner, four-decision loop, and HTTP routes. | Done | 2026-11-07 production build passed; observed API runs searched, read, finalized with a read note ID, and returned insufficient evidence for an unrelated question. Independent review checked the cap, allowlist, and citation validation. |
| WEB-002 | REQ-TA-006, 007; REQ-TA-WEB-001, 003–007 | Build bilingual responsive workspace, source inspector, trace, and persistent theme/locale. | Done | 2026-11-07 browser flow showed answer, citation, original source, ordered localized trace, narrow viewport layout, and persisted English/dark selections after reload. |
| WEB-003 | REQ-TA-WEB-001–007 | Integrate the web app, document actual commands and limitations, and complete independent review. | Done | 2026-11-07 lint, typecheck, and production build passed. Independent review findings were addressed: truthful trace events, stricter fixture question routing, explicit started phase, and focus on cited source. README and diagram describe the observed web app. |
| CLI-001 | REQ-TA-001, 008 | Add the earlier independently runnable CLI using the same core loop. | Planned, later | Exact local command and observed offline output. |
| PROVIDER-001 | Future | Add a provider-backed planner behind the same decision contract. | Planned, later | Separate requirements, consent/credential handling, and semantic evaluation. |

The [core overview SVG](../../system-design/overview.svg) describes the loop. The new web feature defines its user-facing contract. The `CHECKLOG.md` is an orientation note, not a second task board.
