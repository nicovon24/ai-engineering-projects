# Repository agent guide

This repository is Nicolás Von Muhlinen's AI Engineering learning workspace. It is separate from his portfolio website. Each project owns its application, decisions, and run instructions under `projects/<project-name>/`.

This guide applies to every project in this repository. A project-level `AGENTS.md` may add domain-specific instructions without silently changing the delegation policy below.

## Language

- Write code, identifiers, comments, configuration, READMEs, and technical documentation in English.
- User-facing applications support Spanish and English. Spanish is the initial locale. Persist an accessible language choice and pass the selected locale explicitly to AI requests. Preserve direct source quotations in their original language.

## Working agreements

- Read the target project's `AGENTS.md`, `PRODUCT.md` when present, `README.md`, `CHECKLOG.md`, and `docs/specs/tasks.md` before changing its implementation. Follow the most specific applicable instructions.
- Keep project boundaries independent. A project must run locally without requiring another planned application.
- Describe implemented behavior and planned behavior separately. Do not invent demos, evaluation results, production readiness, or deployments.
- Treat external GitHub repositories as learning references. Check licenses and attribution before reusing code, prompts, assets, or data.
- Prefer a small, inspectable pipeline before adding agents, memory, or infrastructure. Add complexity when a concrete requirement or evaluation result justifies it.
- Never commit API keys or user-uploaded documents. Do not create a remote repository, push, or deploy unless the user asks.

## Project continuity and SDD

- Resume in this order: (1) inspect Git branch, commit, and local changes; (2) read the project's `AGENTS.md`, `PRODUCT.md` when present, and `README.md`; (3) inspect the relevant code or confirm that no application exists; (4) read active `docs/features/<slug>/requirements.md` and the canonical `docs/specs/tasks.md`; (5) compare `CHECKLOG.md` with those sources and choose the next ready task. Resolve discrepancies before editing.
- Every project directory has a root `CHECKLOG.md` and `docs/specs/tasks.md`. Create both when adding a new project. The task tracker is the source of task status; the CHECKLOG is a manually maintained orientation note, not an automation or a second task board.
- Before acting, contrast the CHECKLOG with the current code, Git state, project README, feature requirements, and `docs/specs/tasks.md`. Correct stale notes only after checking evidence.
- Keep at most ten dated recent-change entries in each CHECKLOG. Record current prototype status, decisions, recent improvements, and the next technical handoff. Older history remains in Git and feature documents.
- Put active feature requirements under `docs/features/<slug>/requirements.md`; add `design.md`, `tasks.md`, and `review.md` when the feature warrants them. Use observable acceptance IDs and keep task status in `docs/specs/tasks.md` to avoid conflicting copies.
- Plan-only projects may have a short tracker and CHECKLOG without an application or detailed feature spec. Do not mark planned behavior as implemented.

## Delegation and model requests

- Request **Astra (`gpt-6-astra`, medium)** for coordination when the runtime allows the main model to be selected. Request **Astra high** for substantial architecture or planning work. If main-model selection is unavailable, continue with the assigned runtime model and report that its exact identity was not confirmed; do not claim Astra was used.
- Resolve small, low-risk changes directly. Delegate only bounded work with a clear acceptance condition, exclusive file or module ownership, a verification step, and an expected handoff.
- Keep at most two subagents active. Only the coordinator delegates. Subagents must not delegate or revert another agent's changes; they must accommodate concurrent edits.
- Request **Sol (`gpt-6-sol`, medium)** for implementation, **Luna (`gpt-6-luna`, high)** for focused research, and **Sol (`gpt-6-sol`, high)** for independent review. Do not silently substitute another model or reasoning effort. If a requested combination is unavailable, state that limitation before treating a different assignment as equivalent.
- Each delegated task must state its objective, requirements, exact files or modules it may modify, acceptance criteria, verification to perform, and the result to return. A research or review task should normally have read-only ownership.
- Treat profiles under `.codex/agents/` as role adapters. A profile's existence does not prove the effective model. If the runtime exposes only model and reasoning effort at agent creation, include the role instructions in the task message.
- Record **requested model and effort** separately from **runtime-confirmed model and effort** in the task handoff or final report. Use `unconfirmed` when the runtime does not expose confirmation. Never infer the effective model from a profile name or requested setting.

## Current focus

Document Intelligence is the active implementation. Its domain terms, architecture, diagrams, and orchestration are in [its agent guide](projects/document-intelligence/AGENTS.md).
