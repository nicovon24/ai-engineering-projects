# Tool Agent from Scratch

**Status: Done for the local web MVP.** The application is a local workspace for inspecting a bounded tool agent. The older CLI proposal remains in [Feature 01](docs/features/01-bounded-agent/requirements.md); the implemented interface is the [web workspace](docs/features/02-web-workspace/requirements.md).

## What it does

Ask about two fictional bundled notes. An explicit TypeScript loop chooses between `search_notes` and `read_note`, validates each call, stops after at most four decisions, and returns an answer with note IDs that were actually read. The interface shows the answer, original note, and compact execution trace. The first planner is deterministic and needs no API key; a live model integration is later work.

## Local run target

From this directory, install dependencies with `npm install`, then start `npm run dev` and open `http://127.0.0.1:3000`. The production path is `npm run build` followed by `npm run start`. The app needs no provider key or sibling project. A local production build and the browser question-to-source-to-trace flow were observed on 2026-11-07.

The fixture planner answers the documented Faro due-date and first-version-scope questions. Other questions may receive an insufficient-evidence answer. It does not perform open-ended model reasoning.

## Records

[Product scope](PRODUCT.md), [design system](DESIGN.md), [web requirements](docs/features/02-web-workspace/requirements.md), [system design](system-design/README.md), [canonical task tracker](docs/specs/tasks.md), and [CHECKLOG](CHECKLOG.md).
