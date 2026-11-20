# Research Orchestrator checklog

**Status:** Local Groq-only MVP verified; independent review findings fixed; OpenSpec change archived.

## Current direction

- Local, single-user research using automatically discovered public HTTPS URLs.
- Fixed plan, collect, synthesize, and review stages with source-linked findings.
- Explicit human approval and local report history.

## Recent changes

- 2026-11-20: Initialized project-local OpenSpec and validated the proposal, three capability specs, design, and implementation tasks in strict mode.
- 2026-11-20: Revised source intake to automatic web search with at most five public HTTPS results after the user selected web search.
- 2026-11-20: Implemented the local Next.js app, SQLite history, bilingual UI, keyless demo, bounded source retrieval, Groq synthesis contract, and explicit review decisions.
- 2026-11-20: Verified the demo and approval in Playwright, language persistence after reload, no mobile overflow at 390 px, and the missing Brave key stop state. Tests, TypeScript, lint, and build passed.
- 2026-11-20: Corrected Node's pinned DNS lookup callback after a real HTTPS fetch failed. Verified a public page fetch, redirect, image, oversize, and timeout rejection. A direct Groq strict-schema call with the ignored local key returned valid citations.
- 2026-11-20: Changed discovery to Groq-only at the user's request. Used browser-search tool metadata for source URLs and raised the raw HTML cap to 1 MiB after real pages exceeded 128 KiB. The 120B synthesis model hit HTTP 429; 20B passed strict JSON and completed a live draft with four recovered sources and validated citations. Reopened it in the Spanish browser workspace.
- 2026-11-20: Independent review found five gaps. Blocked review before synthesis, rejected additional special IP ranges, enforced one eight-second DNS-to-body deadline, displayed the human-approved text with linked citations, and removed the 30-run history cutoff. Verified the approved demo report in Playwright; seven tests, typecheck, lint, build, and strict OpenSpec validation passed.
- 2026-11-20: Archived the completed OpenSpec change and synced its three capability specs.

## Next technical handoff

Run the app locally for user testing; refine the next research behavior only from a new observed need.
