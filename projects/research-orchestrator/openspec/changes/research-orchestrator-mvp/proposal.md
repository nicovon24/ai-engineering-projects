# Proposal

## Why

Research notes often mix retrieved facts, model synthesis, and an implicit final decision. This project makes each source and stage visible, then requires a human decision before a report is considered approved.

## What Changes

- Add an independent local research workspace that accepts a question and automatically searches the public web for up to five sources.
- Fetch bounded source snapshots and record extraction failures without inventing source content.
- Run an explicit plan → collect → synthesize → review workflow with a bounded trace and source-linked claims.
- Let the user revise the draft and approve it or return it for revision; persist reports and decisions locally.
- Offer a deterministic keyless demonstration. Live synthesis uses a server-side Groq key.

## Capabilities

### New Capabilities

- `source-intake`: Search, validate, fetch, and snapshot public sources within fixed limits.
- `research-run`: Build a bounded, inspectable research draft from the question and collected sources.
- `report-review`: Preserve draft reports, citations, human edits, and explicit approval decisions.

### Modified Capabilities

None.

## Impact

Creates `projects/research-orchestrator/` with its own Next.js application, OpenSpec root, project tracker, local ignored data store, and run instructions. It makes bounded requests to Brave Search, validated public source hosts, and the configured Groq endpoint. It does not deploy, crawl links, execute source code, or share data with other projects.
