# Tool Agent from Scratch CHECKLOG

## Current status

The local Next.js MVP is implemented and observed. A deterministic planner demonstrates the bounded loop with two bundled notes; the app is not a general-purpose or provider-backed agent. Task status lives in `docs/specs/tasks.md`.

## Decisions

- The current first application is an independent local Next.js workspace around a first-party TypeScript loop. The older CLI remains a later milestone.
- A deterministic planner and bundled notes support a keyless local demo.
- `search_notes` and `read_note` are the only MVP tools; both are read-only and confined to a note manifest.
- The loop has at most four planner decisions and explicit terminal states.

## Recent changes

- 2026-11-06: Created the planning documents, first feature requirements, canonical tracker, and basic Mermaid system diagram.
- 2026-11-07: Redrew the planned system overview as a standalone SVG with an editable HTML source; application work remains planned.
- 2026-11-07: Chose a local web workspace using the sibling projects' warm visual direction; added a separate web feature and shared HTTP contract before delegation.
- 2026-11-07: Implemented the loop, validated read-only tools, fictional notes, API routes, and bilingual responsive workspace. Production build, lint, typecheck, and the local browser flow passed; independent review findings on trace ordering, question routing, and citation focus were addressed.

## Next technical handoff

The next optional milestone is the independent CLI or provider-backed planner, each with its own acceptance work. Preserve the first-party loop and avoid presenting the deterministic fixture as model reasoning. Read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, and both feature requirements before editing.
