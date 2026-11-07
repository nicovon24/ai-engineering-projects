# Feature 02: Local web workspace

**Status: Implemented for the local MVP.** The earlier CLI proposal in Feature 01 defines the core tools and loop. This feature makes that core usable in a local Next.js interface while preserving independent project boundaries.

## Acceptance

| ID | Observable requirement |
| --- | --- |
| REQ-TA-WEB-001 | From this project directory, `npm run dev` opens a local Next.js workspace without an API key or another project running. |
| REQ-TA-WEB-002 | The workspace accepts one bounded question, offers two fictional example questions, and sends the selected locale explicitly to a server route. The server validates the request and returns the structured run contract. |
| REQ-TA-WEB-003 | A completed run displays answer text, structured note citations, and a selectable source inspector with the original bundled note content. The UI does not treat a search hit as a citation unless `read_note` returned that ID. |
| REQ-TA-WEB-004 | The trace lists decisions in order with tool names, validation/execution outcomes, and final stop reason. It excludes full note bodies, prompts, and secrets. Failure states remain readable and actionable. |
| REQ-TA-WEB-005 | Spanish is the initial locale. A labeled ES/EN switch persists an explicit selection and updates interface copy; the selected locale reaches the planner. Source quotations remain unchanged. |
| REQ-TA-WEB-006 | The workspace uses the local `DESIGN.md` direction, includes a persistent light/dark choice, visible focus, semantic controls, and responsive layouts for narrow and wide viewports. |
| REQ-TA-WEB-007 | The interface identifies the planner as a deterministic, offline demonstration. A provider-backed planner is later work and is never presented as active without configuration and evaluation. |

## HTTP contract

`POST /api/run` accepts `{ "request": string, "locale": "es" | "en" }` and returns `AgentRun` from `src/lib/contracts.ts`. Invalid input returns a non-2xx response with a typed `AgentRun` error and no tool execution. `GET /api/notes` returns `PublicNote[]` with stable ID, title, and content from the two repository-owned fictional fixtures. Neither route accepts file paths or URLs.

## Implementation route

This is a bounded web extension of an explicit first-party TypeScript loop. The project does not import sibling application code or require a live provider. UI and backend are separate modules with the HTTP contract above. The production build, a browser answer/source/trace flow, and both language/theme preference persistence were observed locally on 2026-11-07.
