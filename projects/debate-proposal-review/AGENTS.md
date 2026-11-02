# Debate and Proposal Review agent guide

Read [PRODUCT.md](PRODUCT.md), [README.md](README.md), [CHECKLOG.md](CHECKLOG.md), the [first feature requirements](docs/features/01-proposal-review/requirements.md), and [the task tracker](docs/specs/tasks.md) before implementation. The local MVP includes real model workflow and persisted human decisions; the task tracker records verification and known quality limits. Root repository instructions still apply.

## Development workflow

Use TDD for new behavior: write and run a failing behavior test, implement the smallest change that passes it, then refactor with tests green. Use deterministic provider doubles for ordinary tests; report live-provider evaluation separately. Node.js 24 is the local test runtime. Follow the root model policy: request Astra medium for planning and coordination, Sol medium for implementation, Luna high for focused research, and Sol high for independent review. Keep at most two subagents active and record requested versus runtime-confirmed identity separately.

The agreed local MVP opens its conversational intake at `/`, lists saved reviews at `/reviews`, and displays analysis and the human decision at `/reviews/[id]`. Keep diagrams in `system-design/` as standalone, accessible SVG files, generated directly by `system-design/build.py`. Do not use HTML as the diagram deliverable. Derive their visual direction from `DESIGN.md`.

## Domain vocabulary

| Term | Meaning |
| --- | --- |
| Proposal | The decision request, options, claimed benefits, costs, and assumptions supplied for review. |
| Source | A permitted document or passage that may support or contradict a factual claim. |
| Claim | One atomic factual statement extracted from the proposal or generated argument. |
| Argument | A reason for or against an option. It may include factual claims and value judgments; rhetoric is not evidence. |
| Evidence verdict | Supported, contradicted, mixed, or insufficient, with cited source passages and a short rationale. |
| Open question | Information needed to narrow uncertainty before a decision. |
| Review state | Temporary progress through intake, arguments, evidence checks, and synthesis. It is not durable model memory. |
| Human decision | A reviewer-owned approve, reject, or defer outcome with rationale and optional conditions. |

## Planned boundaries

1. Accept a proposal and authorized source set. The first fixture is fictional and locally authored.
2. Identify decision options, atomic claims, assumptions, and missing inputs.
3. Run bounded supporting and opposing passes against the same proposal and sources.
4. Retrieve passages for each factual claim; validate source IDs and locators in code.
5. Assign an evidence verdict with a rationale. Citation existence alone does not prove semantic support.
6. Show arguments, verdicts, and unresolved questions together; request a human decision.

Keep generated arguments, source evidence, model judgments, and the human decision separate in storage and UI. Do not let a model's prior answer become source evidence. Avoid treating an equal number of pro and con points as balanced analysis. Preserve the reviewer’s selected locale and direct source quotations.

The [design system](DESIGN.md) is a sibling visual direction to Document Intelligence, not a shared runtime dependency. The [feature design](docs/features/01-proposal-review/design.md) specifies the first screen and data contracts. Public readiness and provider choices are future decisions, not current capabilities.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
