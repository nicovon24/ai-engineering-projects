# Tasks

## 1. Project foundation

- [x] 1.1 Scaffold the independent Next.js/TypeScript app and local run commands; verify it starts on localhost without an API key or another project.
- [x] 1.2 Add repository-local instructions, product/readme orientation, the canonical task tracker, CHECKLOG, and ignored local-data/environment paths; verify their status claims match the scaffold and no secret or user history is tracked.

## 2. Commit-pinned investigation

- [x] 2.1 Implement strict public GitHub URL parsing and default-branch SHA resolution; verify valid, malformed, non-GitHub, private, missing, and rate-limited cases with adapter tests.
- [x] 2.2 Implement SHA-pinned tree and text-file reads with the documented size and entry budgets; verify no source request uses a mutable branch after resolution and binary, oversized, and truncated content yields explicit limits.
- [x] 2.3 Implement the validated `list_tree`, `search_text`, and `read_file` registry and bounded run loop; verify unknown tools, invalid paths or arguments, tool failures, and the eighth-operation boundary stop safely with ordered trace metadata.
- [x] 2.4 Implement a fixture source adapter and deterministic demonstration planner using the same contracts; verify a supported question, an insufficient-evidence question, and a rejected tool call work offline.
- [x] 2.5 Implement provider-backed planning and structured answer validation, including selected locale, untrusted source handling, and citations limited to verified read lines; verify unsupported citation IDs and prompt-like repository text cannot create tool access or source links.
- [x] 2.6 Document the investigation limits and one reproducible live public-repository check; verify the documented command and checked permalink point to the run's SHA.

## 3. Local conversation continuity

- [x] 3.1 Add versioned SQLite schema and local storage for repositories, conversations, all ordered user/assistant messages, runs, inspected paths/outcomes, evidence excerpts, and citations; verify restart preserves order and links without storing keys or complete fetched repositories by default.
- [x] 3.2 Add repository-scoped search across all saved conversation messages plus retrieval of relevant prior evidence and inspected-path outcomes; verify results identify the originating conversation and commit and never mix repositories.
- [x] 3.3 Add per-question commit checks and freshness rules: same-SHA reuse, changed-SHA recheck with an updated saved finding for changed or removed source, and refresh-failure historical labeling; verify all three with controlled adapter fixtures while preserving old answers and permalinks.
- [x] 3.4 Add conversation deletion with dependent-record cleanup and copy reused evidence into each citing run; verify deleting the source conversation removes its records while another conversation and its reused citation remain valid.
- [x] 3.5 Document the local database location, deletion behavior, and current limits; verify the instructions match the storage implementation.

## 4. Bilingual workspace

- [x] 4.1 Build the repository intake and conversation view with questions, answers, commit badges, cited file/line links, trace, and visible insufficient-evidence and stale states; verify the primary user flow in a browser at desktop and narrow widths.
- [x] 4.2 Add cross-conversation search and navigation plus per-conversation deletion controls; verify the user can find an earlier answer, open it, and delete only its conversation through the UI.
- [x] 4.3 Add Spanish-first and English interfaces with an accessible persisted switch and explicit locale in answer-generation requests; verify both locales after reload and preserve source quotations verbatim.

## 5. Integration review

- [x] 5.1 Run the project's build, type and lint checks plus the focused behavior tests; verify all pass and review the diff for unrelated files or unsupported completion claims.
- [x] 5.2 Exercise the end-to-end local flow with a public repository at one commit, a repeated question, and a simulated new commit; verify the new answer rechecks source while historical answers retain their original citations.
- [x] 5.3 Compare implemented behavior with both capability specs, record any gaps and observed results in the project tracker/CHECKLOG, and obtain an independent review before calling the MVP complete.
- [x] 5.4 Configure the live planner with the workspace's Groq API pattern, use strict structured decisions for read-only operations with server-side argument validation, keep credentials server-side, and preserve strict answer output and the keyless fixture.

## Workflow follow-up

- Sync and archive the OpenSpec change only after implementation and verification are accepted.
