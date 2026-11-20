# Research Orchestrator product outline

**Status: Local MVP verified.** The task tracker records the completed implementation and checks. This is a local single-user prototype.

## Purpose

Turn a question and automatically discovered public sources into a source-linked research draft with visible stages and an explicit human review decision.

## MVP contract

- Enter a research question; search the web automatically for up to five public HTTPS sources.
- Collect bounded source text and show per-source failures.
- Create a plan and report with source-linked findings, or stop with a clear reason.
- Keep the report pending until a human edits and approves it or returns it for revision.
- Save runs locally and reopen them after restart.
- Start in Spanish, offer English, and pass locale to the provider.

## Limits

The first version is local and single-user. It does not crawl links itself, publish reports, or support private sources. A fixed demonstration works without credentials; live discovery and synthesis need only `GROQ_API_KEY`. Groq's browser-search tool may internally visit multiple pages, which this app cannot count.
