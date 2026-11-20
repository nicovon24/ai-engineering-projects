# Research Orchestrator product outline

**Status: In progress.** The current project is being built; the OpenSpec change describes the intended MVP. Only verified behavior is marked implemented in the task tracker.

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

The first version is local and single-user. It does not crawl links, publish reports, or support private sources. A fixed demonstration works without credentials; live search needs `BRAVE_SEARCH_API_KEY` and synthesis needs `GROQ_API_KEY`.
