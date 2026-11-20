# Design

## Context

This is a new independent project with no application or existing capability specs. The repository proposes a read-only public GitHub investigator with file-linked answers and an inspectable trace. The user additionally chose local, cross-conversation recall of questions, answers, discussion, and prior investigation, with an update when the repository changes. See the proposal and the two delta specs for behavior.

## Goals / Non-Goals

**Goals:**
- Keep repository evidence tied to immutable commits while making conversations easy to resume and search.
- Make tool choice, bounds, and citation validation visible and testable.
- Run locally as a single-user application with a keyless fixture path and a Groq-backed path for open-ended questions. Read `GROQ_API_KEY`, `GROQ_MODEL`, and optional `GROQ_BASE_URL` from the server environment.
- Use strict JSON schema decisions for bounded repository actions, then validate every action and argument on the server before source access. Require strict structured output for final answers. This avoids Groq GPT-OSS `tool_use_failed` errors observed with required function calling.

**Non-Goals:**
- Curated user-profile memory, autonomous background refresh, cross-device sync, private-repository access, git writes, or executing repository code.
- Exhaustive indexing of arbitrarily large repositories. Limits and incomplete coverage must be visible.

## Decisions

### Independent local web application

Use a project-local Next.js App Router and TypeScript application, following the repository's default for user-facing projects. Keep the investigation loop, GitHub adapter, persistence, and UI in this project; reuse concepts from Tool Agent from Scratch, not its runtime code. The browser talks only to local server routes for repository access and persistence. Alternative considered: a CLI-only tool; it would make cross-conversation browsing and source inspection less useful for the chosen workflow.

### Commit-pinned source adapter and bounded tools

Parse only canonical `https://github.com/<owner>/<repo>` URLs, resolve the default branch to one SHA at the start of each question, and request tree and file content by that SHA. Do not use GitHub code search as evidence because its results are not pinned to the run's SHA. Instead, expose `list_tree`, `search_text`, and `read_file` over a bounded manifest and text fetches at the pinned commit. Validate tool schemas, paths, content type, and budgets on the server. Initial budgets: at most 8 tool operations, 2,000 tree entries, 100 KiB per text file, and 1 MiB of retrieved text per run; stop with an explicit partial-coverage reason when a limit prevents a reliable answer. Use a fixture adapter with the same interface for offline, keyless demonstrations. Alternative considered: cloning arbitrary repositories; it creates more local disk and process risk for this read-only MVP.

### Source-verified answer contract

The answer generator receives the selected locale, bounded tool outcomes, and relevant prior context. It returns structured answer text, evidence references, and a terminal status. A validator accepts citations only for line ranges in files actually read at the run's SHA, or previously read at that same verified SHA. The UI constructs GitHub permalinks from validated owner, repo, SHA, path, and line range. Repository text is untrusted data, never tool instructions. The fixture planner follows the same output contract and clearly labels its deterministic behavior. Alternative considered: accepting citation-like text from a model; that cannot prove the cited file was read.

### Local conversation and investigation store

Use a local SQLite database under an ignored application-data directory. Store repositories by canonical owner/repo; conversations and all ordered user and assistant messages separately from runs, inspected paths and outcomes, evidence excerpts, and citations. Search saved message text within the selected repository and show the originating conversation and commit. Store enough evidence text and line coordinates to validate same-commit reuse; do not retain entire fetched repositories by default. When a later run reuses verified evidence, copy the needed excerpt and coordinates into that run so its citation survives deletion of the originating conversation. Conversation deletion cascades only to its own messages, runs, and retained evidence. Alternative considered: browser localStorage; it is poorly suited to cross-conversation search, referential integrity, and server-side evidence validation.

### Freshness on every new question

Resolve the current default-branch SHA before answering. If it equals a relevant prior run's SHA, previously validated evidence may be reused with attribution. If it differs, prior findings are context only: re-read relevant paths at the new SHA and perform bounded new search as needed before claiming a current answer. Save the refreshed result at the new SHA, including a changed or removed-source outcome; keep old messages and permalinks unchanged and mark them historical. If resolution or recheck fails, report the failure and offer only historical findings labeled as such. Alternative considered: rewriting old answers on refresh; that would destroy the historical record and its traceability.

### Local-only single-user boundary

Bind the development application to localhost and do not add accounts in the MVP. Do not expose a shared-host deployment without a separate authentication and data-protection design. Keep API keys in ignored environment files or process environment; never write them to the history database or trace. Alternative considered: cloud persistence now; it adds identity, sync, and operational work outside the user's local-first scope.

## Risks / Trade-offs

- GitHub rate limits, deleted repositories, or default-branch changes → show a typed refresh failure; preserve historical citations and do not claim current verification.
- Huge or truncated trees and binary or oversized files → enforce budgets and surface incomplete coverage instead of implying exhaustive search.
- Prompt injection in repository text or prior answers → treat both as data; validate all tool calls and citations outside the model.
- Stale prior conclusions after a commit change → require fresh current-commit evidence before a current claim.
- Local database loss or access by other users of the computer → document the storage location and local deletion behavior; cross-device backup and OS-user isolation are outside this MVP.

## Migration Plan

There is no existing application data to migrate. Implement the fixture path first, then GitHub access and optional provider answers against the same contracts. Keep schema migrations versioned from the first SQLite schema so later local updates can preserve conversation history. No deployment is planned.
