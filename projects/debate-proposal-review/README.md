# Debate and Proposal Review

## Problem

Review a proposal through competing perspectives, evidence checks, and a final human decision.

## Target user

A team evaluating a consequential product or operational proposal.

## Intended demo

Review the [original fictional help-desk proposal](docs/examples/support-draft-pilot/proposal.md), compare supporting and opposing arguments against the same small permitted source set, inspect claim-level evidence and unresolved questions, and record a human conclusion. The example contains invented observations and is not a measured pilot.

## MVP scope

Proposal input; bounded pro and con passes; claim ledger; source retrieval; evidence verdicts; unresolved-question list; human review step.

## Architecture

An independent Next.js application opens a conversational intake at `/`, lists saved reviews at `/reviews`, and shows generated analysis and human decisions at `/reviews/<id>`. The original hand-authored fixture remains at `/example`. A bounded server workflow validates each stage, restricts citations to review-owned candidates, and saves atomic JSON records on local disk. Groq is accessed through a replaceable server-side adapter. See the [feature design](docs/features/01-proposal-review/design.md) and [system diagrams](system-design/README.md).

## Run locally

Use Node.js 24 for the application and TypeScript behavior tests. From this directory:

```sh
npm install
npm run dev -- --port 3301
```

Open `http://127.0.0.1:3301`. The port can be changed if another local app uses it. Copy `.env.example` to an ignored `.env.local` and configure `GROQ_API_KEY` for real generation; optional `GROQ_MODEL` and `GROQ_BASE_URL` stay server-side. Without a key, the fixture and local preparation remain available. Reviews are stored under `.data/reviews/`; `DPR_DATA_DIR` can override this location for isolated tests.

To try another Groq model, set `GROQ_MODEL=openai/gpt-oss-120b` in `.env.local` and restart the app. The default is `openai/gpt-oss-20b`; both responded to a small live structured-output check on 2026-11-02. A model change does not remove account or organization rate limits. Run `node evals/provider-health.mjs <model-id>` for a small synthetic connectivity check that reports HTTP status and rate-limit headers without sending a saved review. The current account limits are shown in the Groq console.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. If a sandbox blocks Node test worker spawning, use `node --test --test-isolation=none tests/*.test.mjs`. New behavior follows TDD. Browser checks use Playwright CLI; test scripts live under `tests/browser-*.js`.

## Local workflow and limits

Authorize external processing before the first AI message, discuss the decision, add permitted sources, edit the summary, and explicitly select Generate review. You can leave unknowns open: after at most two clarification replies, or when asked to stop questioning, the chat points to the editable summary instead of starting another round of questions. Each successful stage is saved, so a failure can be retried. The final approve/reject/defer outcome is a human action with a required rationale; it can be corrected later. Delete records from the history page when no longer needed.

When no sources were added, factual claims receive `insufficient` verdicts and the synthesis states that no evidence was checked. These final stages need no additional model call, including when resuming a review already at Evidence. Generated arguments can still contain unsupported or inconsistent assertions; the reviewer must inspect them and keep unresolved details open. Sources cannot be added after generation starts; create a new review to evaluate added evidence.

The MVP accepts pasted text, TXT, MD, digital PDF, and DOCX: up to five sources, 5 MB per file, 40,000 extracted characters per source, and 80,000 total. It retains extracted text and metadata rather than original uploaded bytes. Scanned PDFs require OCR outside this milestone. Model context uses bounded excerpts; larger source sets use limited lexical retrieval. This is a local, single-process application without accounts, production storage, automatic expiration, or public deployment.

## Data requirements

Example proposal, permitted source documents, citation metadata, and human-labeled claim support cases.

## Model and tool choices

Use structured model turns for perspective generation; deterministic validation of schema and citations. A model judge may rank persuasive quality but cannot prove factual correctness.

## Memory if applicable

Execution state tracks review stages; approved review history is separate from indexed evidence.

## Evaluation plan

Score claim-to-source support, missing counterarguments, unresolved-question recall, and human reviewer agreement; assess persuasive quality separately.

## Risks

Persuasive but unsupported claims, false balance, source bias, and hidden assumptions.

## References and original approach

These repositories are learning references, not specifications or sources of project claims. Review each repository's current code and license before reuse. Do not copy another author's code, prompts, interface, branding, assets, or reported results without appropriate permission and attribution.

| Reference project and exact URL | What to study | Relationship | What this implementation will do differently | License and attribution questions before reuse |
| --- | --- | --- | --- | --- |
| [AI Debate Agent](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/ai_debate_agent) | Structured turns, shared state, and a judging step. | Technical analogy | Build a proposal review product, not a debate game; distinguish factual support from rhetoric and leave the final decision to a human. | Check the repository and relevant file or asset licenses, third-party dependencies, prompt and data provenance, attribution requirements, and whether reuse is permitted. |

## Status

Local MVP implemented and verified. Contracts, local persistence, digital intake, Groq transport, staged review, HTTP operations, and the chat-first UI are implemented. Verification and independent review status are recorded in [the task tracker](docs/specs/tasks.md), with [CHECKLOG.md](CHECKLOG.md) as the continuity note. Synthetic-provider tests do not establish model quality; live synthetic checkpoints are reported separately under `evals/`.

## Next steps

Use the local MVP; the independent reviewer scored the five recorded findings resolved, and the final build and browser flow passed. Preserve the measured limitations in the task tracker. Expand semantic support and counterargument evaluation before making quality claims; a valid citation does not prove that its passage supports a claim.
