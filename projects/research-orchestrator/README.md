# Research Orchestrator

**Status: MVP implementation in progress.** A local, bilingual workspace for bounded source-based research and human-reviewed reports. The [active OpenSpec change](openspec/changes/research-orchestrator-mvp/proposal.md) defines the intended MVP.

## Run locally

Requires Node.js 24. From this directory, run `npm install` and `npm run dev`, then open `http://127.0.0.1:3002`. The keyless demo works without external services. For live research, copy `.env.example` to ignored `.env.local`, set `BRAVE_SEARCH_API_KEY` for [Brave Web Search](https://api-dashboard.search.brave.com/api-reference/web/search/get), and set `GROQ_API_KEY` for [Groq structured outputs](https://console.groq.com/docs/structured-outputs). The default model is `openai/gpt-oss-120b`.

## Current status

The OpenSpec planning artifacts pass strict validation. The demo, approval, saved history, language persistence, and mobile layout were verified locally. The live path stops with a clear message when the Brave key is absent; live provider integration remains unverified. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. See [CHECKLOG](CHECKLOG.md) and the [task tracker](docs/specs/tasks.md).
