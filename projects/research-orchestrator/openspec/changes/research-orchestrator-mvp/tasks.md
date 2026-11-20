# Tasks

## 1. Project foundation

- [x] 1.1 Scaffold the independent Next.js app, run commands, ignored local files, README, PRODUCT, AGENTS, CHECKLOG, and task tracker; verify it starts on localhost without another project.
- [x] 1.2 Add a Spanish-first accessible language choice persisted locally; verify Spanish and English after reload.

## 2. Source intake

- [ ] 2.1 Implement one bounded Brave web search and strict result URL validation with public-address-pinned HTTPS fetching; verify malformed, private, duplicate, redirected, and valid URLs with focused tests.
- [ ] 2.2 Extract bounded plain text from HTML or text responses and record source-specific failures; verify size, timeout, content-type, and instruction-like input cases.

## 3. Research pipeline

- [x] 3.1 Implement plan → collect → synthesize → review stage states and typed stop outcomes; verify ordered trace and no synthesis when collection yields no evidence.
- [ ] 3.2 Add strict Groq JSON source-linked synthesis with server-side citation validation and explicit locale; verify unsupported source IDs are rejected and provider failures are localized.
- [x] 3.3 Add a labeled keyless demo through the same report and review contracts; verify it needs no provider key or network source read.

## 4. Local reports and review

- [x] 4.1 Add versioned local SQLite persistence for runs, source snapshots, stages, report text, and decisions; verify a separate process and page reload preserve a complete run without keys.
- [x] 4.2 Implement edit, approve, and return-for-revision actions; verify only explicit approval marks a report approved and source snapshots remain unchanged.
- [x] 4.3 Build the bilingual workspace for intake, stage trace, source-linked findings, and report review; verify the main user flow and narrow viewport in a browser.

## 5. Integration

- [ ] 5.1 Run focused tests, typecheck, lint, build, and a complete demo browser flow; review the diff and record real results in README, CHECKLOG, and the task tracker.
- [ ] 5.2 Compare the delivered behavior with all three capability specs and obtain an independent review when authorized; record remaining gaps before calling the MVP complete.

## Workflow follow-up

- Sync and archive the change after implementation and verification are accepted.
