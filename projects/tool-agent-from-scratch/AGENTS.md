# Tool Agent from Scratch agent guide

Follow the repository `AGENTS.md` and the local project records before implementation. The current target is an independent local Next.js workspace around an explicit TypeScript agent loop. The earlier CLI proposal remains planned. The task tracker at `docs/specs/tasks.md` is the source of status.

## Design constraints

- Keep the decision loop explicit in first-party TypeScript. Do not hide it behind an agent framework.
- Build the keyless fixture demo first. Provider-backed planning is a later, separately evaluated integration.
- Allow only the two named, read-only tools over bundled sample notes in the first MVP. Validate structured arguments and enforce a fixed tool registry and note manifest.
- Keep execution traces inspectable without logging arbitrary note bodies, secrets, or full prompts.
- Show a bilingual workspace with Spanish as the initial locale. Persist an explicit language selection locally and pass locale into every planner call.
- Keep this project runnable without another repository project, service, account, or API key.

## Continuity

Inspect Git state, then read `PRODUCT.md`, `DESIGN.md`, `README.md`, `CHECKLOG.md`, both feature requirements, and `docs/specs/tasks.md`. Compare their claims with the code before choosing a task. Planned behavior must stay labeled Planned until implemented and verified. Before editing Next.js code, read the relevant versioned guide in this project's `node_modules/next/dist/docs/` after dependencies are installed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
