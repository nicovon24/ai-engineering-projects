# Design

## Context

This is a new project with no existing application or stored data. It must run independently on localhost and follow the repository's Spanish-first bilingual application convention. See the proposal and the three capability specs for behavior.

## Goals / Non-Goals

**Goals:** Keep source intake, stage outcomes, model synthesis, and human approval independently inspectable. Preserve a deterministic keyless path so the full review flow can be checked without provider availability.

**Non-Goals:** Unbounded search, crawling, background jobs, multi-user accounts, collaboration, source-code execution, or publishing approved reports externally.

## Decisions

### Local Next.js workspace

Use an independent Next.js App Router application with server-side routes and a local SQLite database. The browser sends question and locale to the server and receives saved run views. Search, Groq, and source requests stay server-side. A CLI would make review and source inspection less direct for this workflow.

### Bounded search and public URL retrieval boundary

Search the question with Brave Web Search using `BRAVE_SEARCH_API_KEY`, one query and at most five results. Search metadata is discovery, never evidence. Deduplicate results and accept only canonical HTTPS URLs with DNS names. Reject credentials, IP literals, loopback/private/reserved DNS answers, duplicates, and redirects. Pin the public DNS address for the outgoing TLS request and enforce a short timeout, supported MIME type, 128 KiB per response, and 5 sources. Strip scripts/styles and HTML markup into bounded plain text. This deliberately excludes some legitimate sites that require redirects or client-side rendering; the user sees a source-specific failure rather than a fabricated excerpt. Do not follow page links.

### Fixed orchestration

The server creates a run and records four stages: plan, collect, synthesize, review. Plan makes a short question outline; collection searches and retrieves at most five results; synthesis receives bounded snapshots and returns strict JSON with a summary, findings, source IDs, and limitations. The server validates every source ID against successful snapshots. No open-ended tool calls are exposed to the model. A failed stage stops later stages with a typed reason.

### Review and history

Store run metadata, source snapshots, stage outcomes, report draft, and review action in local SQLite. A new draft is `pending`. Editing changes the report text, not the source snapshots. `approved` requires an explicit action and stores a timestamp; `revision_requested` keeps a note. The UI distinguishes model-authored and human-edited text. Deleting or exporting history is outside this MVP and can be added later.

### Demo and provider

The keyless demo uses two fixed, labeled source snapshots and a deterministic report; it passes through the same persistence and review views. Live search uses `BRAVE_SEARCH_API_KEY`; synthesis uses `GROQ_API_KEY`, optional `GROQ_MODEL`, and strict JSON-schema chat completion. API keys stay in ignored local environment configuration and are never stored in the database.

## Risks / Trade-offs

- Source extraction loses layout, tables, and client-rendered content → show the retained plain-text excerpt and source status; do not claim exhaustive coverage.
- DNS rebinding or redirect-based server-side request forgery → pin a validated public address for each request and refuse redirects and IP literals.
- Model assertions may overreach source text → require source identifiers on findings, validate identifiers, and keep human approval explicit. Semantic truth still needs human review.
- Provider or source rate limits → persist a typed failed run and leave any prior reports intact.
- Local database access by another OS user → document storage and keep the app bound to localhost; multi-user access is excluded.

## Migration Plan

There is no existing data. Start the database at schema version 1 and keep migration checks in the store. The app remains local; rollback is a code checkout with the local database retained.
