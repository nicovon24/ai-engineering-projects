# Research Orchestrator

**Status: Local MVP verified.** A local, bilingual workspace for bounded source-based research and human-reviewed reports. The [OpenSpec change](openspec/changes/archive/2026-11-20-research-orchestrator-mvp/proposal.md) defines the MVP.

## Run locally

Requires Node.js 24. From this directory, run `npm install` and `npm run dev`, then open `http://127.0.0.1:3002`. The keyless demo works without external services. For live research, copy `.env.example` to ignored `.env.local` and set `GROQ_API_KEY`. Groq's [browser search](https://console.groq.com/docs/tool-use/built-in-tools/browser-search) discovers public URLs with `openai/gpt-oss-120b`; [structured outputs](https://console.groq.com/docs/structured-outputs) produce the report with `openai/gpt-oss-20b` by default. Both models are configurable locally.

## Current status

The demo, approval, complete saved history, language persistence, and mobile layout were verified locally. A complete Groq-only live run found five sources, recovered four, and produced a source-linked draft in the Spanish browser workspace. The source fetch has an eight-second total deadline and a 1 MiB response cap; rejected sources remain visible. `openai/gpt-oss-120b` hit its usage limit during synthesis in an earlier run; the 20B default completed the report. Seven focused tests, typecheck, lint, build, strict OpenSpec validation, and an independent review passed. The review identified five gaps that were corrected before closure: review timing, special IP ranges, total fetch timeout, approved report display, and complete history access. See [CHECKLOG](CHECKLOG.md) and the [task tracker](docs/specs/tasks.md).
