# Repository Investigation Agent

Local, bilingual investigation of public GitHub repositories with commit-linked evidence and conversation history. The [OpenSpec change](openspec/changes/repository-investigation-mvp/proposal.md) defines the local MVP.

The [system design diagrams](docs/system-design.html) show the implemented architecture, live-question sequence, and local SQLite data model in the application's visual style. Open the HTML file in a browser; each diagram scrolls independently on narrow screens.

## Run locally

Requires Node.js 24. From this directory:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. The server binds to localhost. Use **Load keyless demo** to try the same investigation, citation, and history flow with a deterministic fixture. Open-ended questions about live public repositories use Groq. Configure `GROQ_API_KEY` in an ignored `.env.local` file; `GROQ_MODEL` defaults to `openai/gpt-oss-20b`, and `GROQ_BASE_URL` can override the OpenAI-compatible API endpoint. See `.env.example`. On 2026-11-20, a complete live question about `nicovon24/fintrack` at commit `8d2592e9b1` returned source-backed answers in English and Spanish using `openai/gpt-oss-120b`; the browser displayed the English answer, citations, and trace. Other models and repositories have not been evaluated end to end.

Live GitHub reads use the unauthenticated public API by default and can hit its shared rate limit. To raise the limit, add a fine-grained `GITHUB_TOKEN` with public repository read access to this local `.env.local` and restart the server. The token is sent only to `api.github.com` from the server and is never sent to the model or browser. `GH_TOKEN` is also accepted.

## Investigation limits

Each run resolves the default branch to a 40-character commit SHA before reading source. Tree and file requests then use that SHA. The loop allows at most 8 tool operations, 2,000 tree entries, 100 KiB per UTF-8 text file, and 1 MiB of retrieved text. Text search scans at most 20 eligible files per call and reports scanned/total coverage to the planner. An incomplete or oversized source can stop the run; the answer is marked insufficient when inspected evidence cannot support it. Public GitHub access may be rate limited.

For a reproducible live source check, run `npx tsx scripts/check-live.ts`. On 2026-11-20 it resolved `octocat/Hello-World` to `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`, read `README` at that SHA, and returned `Hello World!` on line 1. The checked [permalink](https://github.com/octocat/Hello-World/blob/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d/README#L1) uses the same SHA. An earlier attempt was rate limited; GitHub access may vary between runs.

Run `npx tsx scripts/check-flow.ts` for a live read followed by a repeated question and a simulated changed commit. It uses a deterministic planner without a model key, saves three runs in a temporary local database, verifies same-commit reuse and preservation of the original citation, and removes that database on completion. The changed SHA is a fixture value, not a real GitHub commit. The successful 2026-11-20 run read `README` once for the first two questions and preserved both commit-specific citations.

## Local history

Conversations, ordered questions and answers, inspected paths, evidence excerpts, citations, and traces are stored in `.local-data/agent.sqlite` under this project. Its SQLite WAL files and `.env.local` are ignored by Git. Search is scoped to the selected repository. A new question resolves the current SHA and rechecks up to three relevant previously inspected paths if the commit changed. Old answers and commit permalinks stay intact. Deleting a conversation removes its records; evidence reused in another run is copied into that run, so its citations survive. To reset all local history while the server is stopped, delete the `.local-data` directory. The app stores excerpts (up to 4 KiB each), not complete fetched repositories or API keys.

## Status and records

See [PRODUCT.md](PRODUCT.md), [CHECKLOG.md](CHECKLOG.md), and [task status](docs/specs/tasks.md). This project is independent of Tool Agent from Scratch and Document Intelligence, but adapts their explicit tool-loop and source-provenance patterns.
