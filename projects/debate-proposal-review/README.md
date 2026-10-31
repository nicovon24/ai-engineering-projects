# Debate and Proposal Review

## Problem

Review a proposal through competing perspectives, evidence checks, and a final human decision.

## Target user

A team evaluating a consequential product or operational proposal.

## Intended demo

Review an example proposal, compare supporting and opposing claims with cited evidence, inspect unresolved questions, and record a human conclusion.

## MVP scope

Proposal input; bounded pro and con passes; claim ledger; source retrieval; evidence verdicts; unresolved-question list; human review step.

## Architecture

Independent Next.js application with a small staged server workflow; each stage stores structured outputs and source IDs. Add durable jobs if reviews become long-running.

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

Planned. The intended demo and MVP above are plans, not implemented features.

Read [CHECKLOG.md](CHECKLOG.md) for recent context and [docs/specs/tasks.md](docs/specs/tasks.md) for task status before starting this project.

## Next steps

Draft one example proposal and evidence set, then implement the claim ledger prototype.
