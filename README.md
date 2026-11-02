# AI Engineering Projects

An independent workspace for Nicolás Von Muhlinen, a fullstack developer in Córdoba, Argentina, to build practical AI Engineering projects. This repository is separate from my personal portfolio. The portfolio may later link to completed applications and repositories.

The projects are a development plan. Document Intelligence is **In progress** as a local prototype; the other projects are **Planned**. This repository does not claim measured results or deployments.

## Priority projects

The order below is the intended development order. Only the first, fifth, and thirteenth project directories currently exist; the remaining paths are reserved for future independent applications.

| # | Project | Purpose | Status | Directory |
| --- | --- | --- | --- | --- |
| 1 | [Document Intelligence](projects/document-intelligence/README.md) | Document RAG with verifiable citations and explicit insufficient-evidence handling. | In progress | `projects/document-intelligence/` |
| 2 | AI Evaluation Lab | Reproducible cases, regression checks, and quality, cost, and latency comparisons, beginning with Document Intelligence. | Planned | `projects/ai-evaluation-lab/` (future) |
| 3 | Tool Agent from Scratch | An explicit tool-calling loop with useful tools, limits, errors, and traces. | Planned | `projects/tool-agent-from-scratch/` (future) |
| 4 | Spec Refinery | Turn vague requests into implementable specifications through questions, retrieved documentation, decisions, and human review. | Planned | `projects/spec-refinery/` (future) |
| 5 | [Debate and Proposal Review](projects/debate-proposal-review/README.md) | Review proposals from competing perspectives, check claim evidence, and support a final human decision. | Planned | `projects/debate-proposal-review/` |
| 6 | Finagent | Read-only financial research with sourced data, traceable calculations, and a useful MCP interface. | Planned | `projects/finagent/` (future) |
| 7 | Research Orchestrator | Source-based research through bounded stages, a report, and human review. | Planned | `projects/research-orchestrator/` (future) |
| 8 | Personal Agent with Memory | A limited assistant with tools, searchable conversation history, and user-controlled long-term memory. | Planned | `projects/personal-agent-with-memory/` (future) |
| 9 | Document Extraction Studio | Extract validated structured data from PDFs and images with review of uncertain fields. | Planned | `projects/document-extraction-studio/` (future) |
| 10 | Pasture Feeding Planner | Explore herd and paddock grazing scenarios with weather data and visible uncertainty. | Planned | `projects/pasture-feeding-planner/` (future) |
| 11 | Agricultural Cost Analyst | Calculate agricultural and livestock costs with traceable arithmetic and assumptions. | Planned | `projects/agricultural-cost-analyst/` (future) |
| 12 | Agricultural Document Assistant | Answer questions about authorized organizational manuals with citations and access controls. | Planned | `projects/agricultural-document-assistant/` (future) |
| 13 | [Spreadsheet Dashboard Studio](projects/spreadsheet-dashboard-studio/README.md) | Turn an uploaded Excel workbook into an editable dashboard with traceable metrics and chart suggestions. | Planned | `projects/spreadsheet-dashboard-studio/` |

## Current repository scope

`projects/document-intelligence/` contains an independently runnable local Next.js prototype and its project plan. `projects/debate-proposal-review/` and `projects/spreadsheet-dashboard-studio/` contain plans, learning references, and task records only. Other project directories and experiments will be added when work on them begins. Each eventual application should be independently runnable and deployable.

## Working records

The [repository agent guide](AGENTS.md) defines the SDD and CHECKLOG workflow. [Repository workflow tasks](docs/specs/tasks.md) track shared documentation. Every existing project has a root `CHECKLOG.md` for recent, manually checked context and a `docs/specs/tasks.md` file for task status. The active Document Intelligence requirements and architecture live under [its numbered feature plans](projects/document-intelligence/docs/features/README.md).

## Engineering direction

- Use Next.js App Router and TypeScript by default for user-facing applications. Prefer Server Components for reads, Server Actions for real user-initiated mutations, and Route Handlers for HTTP endpoints and streaming.
- Add FastAPI and Python only where document libraries, processing, or agent orchestration provide a concrete benefit. Move long-running work to durable jobs and workers when needed.
- Support Spanish and English in user-facing applications. Start in Spanish, provide an accessible language switcher, persist the choice, and pass the selected locale explicitly to AI chats. Preserve direct source quotations in their original language.
- Keep conversation history, execution state, curated memory, and indexed source documents distinct. Require source traceability, validated structured outputs, deterministic calculations, appropriate authorization, and meaningful evaluation for implemented AI features.
- Keep local development possible without API keys. Use read-only tools and sample data for early prototypes where appropriate.
- Treat linked repositories as learning references. Check licenses and attribution before reusing code or assets; do not present another author's code, prompts, interface, branding, or results as my own.

## Initial 12-week direction

| Weeks | Focus | Intended outcome |
| --- | --- | --- |
| 1–3 | Document Intelligence foundation | Document intake and source metadata prototype; no chat claims before retrieval and citation validation work. |
| 4–5 | Document Intelligence and AI Evaluation Lab | Small labeled corpus, cited-answer behavior, insufficient-evidence cases, and replayable regression checks. |
| 6–7 | Tool Agent from Scratch | Bounded loop, validated read-only tools, error handling, and inspectable traces. |
| 8–9 | Spec Refinery | Question and decision workflow with a reviewed draft specification. |
| 10 | Debate and Proposal Review prototype | One example proposal, cited evidence, claim support checks, unresolved questions, and a human review step. Evaluate factual support separately from persuasive quality. |
| 11 | Finagent prototype | Timestamped sample data, one deterministic calculation, sourced interpretation, and explicit missing information. Recalculate outputs from recorded inputs. |
| 12 | Consolidation | Review evaluation results and choose the next application milestone. Optionally deploy one already working application to AWS as a learning exercise; AWS is not required for local development. |

The remaining priority projects belong to a later phase. This schedule does not promise thirteen completed products in twelve weeks.

## Optional ideas

These are ideas only; no application directories exist for them. The relationship describes the learning reference, not an implementation claim.

| Idea | Reference | Relationship |
| --- | --- | --- |
| Hybrid Search Lab | [Soccer Analytics Agent](https://github.com/ramiro-c/ai-agents-hub/tree/main/soccer-analytics-agent) | Technical analogy |
| Model and Prompt Comparator | [Agent Evals](https://github.com/ramiro-c/agent-evals) | Direct |
| Agent Observability Dashboard | [LangGraph Orchestrator](https://github.com/ramiro-c/orquestador-langgraph) | Technical analogy |
| Support Agent with Human Escalation | [Customer Support Chat](https://github.com/ramiro-c/ai-agents-hub/tree/main/customer-support-chat) | Direct |
| Video and Transcript Assistant | [YouTube Transcript RAG](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/rag_apps/youtube_transcript_rag) | Direct |
| Advanced Portfolio Assistant | [Botardo chat worker](https://github.com/ramiro-c/ramirocerda/tree/main/workers/chat-worker) | Technical analogy; possible future addition to the separate portfolio |
| News Radar / Daily Digest | [Daily News Digest](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/daily-news-digest) | Direct |
| Data Analyst with Generated Reports | [Multi-Agent Financial Analyst](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/multi_agent_financial_analyst) | Technical analogy |
| Travel Planner Agent-inspired exercise | [Travel Planner Agent](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/travel_planner_agent) | Direct |
| Rock Music RAG-inspired exercise | [Rock Music RAG](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/rag_apps/rock_music_rag) | Direct |
| LLM Agri Bot-inspired exercise | [LLM Agri Bot](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/llm_agri_bot) | Direct |
