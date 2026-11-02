# Conversational assistant proposal

Status: Proposed; no application behavior in this document is newly implemented.

The three [system diagrams](../../../../system-design/README.md) describe current behavior. The answer path and delivery order below are proposals.

## Objective

Extend the document workspace into a conversational assistant that can answer document questions, explain general concepts, and optionally consult current public sources. Preserve inspectable evidence and distinguish missing facts from questions that require clarification. The user's motivating sequence includes nickname resolution, React experience, age, residence, nationality, and city follow-ups.

## Verified starting point

- The UI and question route require uploaded documents, including for general questions.
- Saved history is displayed but is not passed to question rewriting, retrieval, or generation.
- Query rewriting creates bilingual lexical variants of the current question; it does not resolve conversational references.
- Local multilingual vectors and lexical rankings are fused into up to five passages. The lexical score is term overlap, not BM25; the semantic threshold has narrow calibration.
- General generation only follows document abstention and accepts an explicit concept whitelist. React is not in that list.
- Answer validation checks output shape, known citation IDs, and a bounded nickname wording rule. It does not establish semantic support for every claim.
- Product documentation currently centers document Q&A. Broad general chat is a proposed product extension and must be documented as such when implemented.

## Proposed interaction

Default to automatic source selection. Allow the visitor to constrain questions to uploaded files, and provide an explicit web-search control when a web capability is configured. Show source attribution on each relevant response section rather than a repeated generic disclaimer. General chat should work without uploaded files when a generation provider is configured. Preserve evidence-only operation without a model key.

The planner produces a validated source intent: document, general, web, mixed, or clarification. Code enforces workspace access, provider availability, limits, and which source types may support which claims. A planner result is not evidence.

Examples:

| Input | Desired behavior |
| --- | --- |
| Who is Nico? | Resolve a supported candidate, qualify an unconfirmed alias, and cite the document. |
| What did he do with React? | Resolve the subject from the conversation and retrieve source evidence for individual work claims. |
| What is React? | Explain the general concept without requiring a file or inventing a CV citation. |
| Where does he live? | Answer only if the source supports residence; do not convert nationality or birthplace into residence. |
| Which city? | Resolve subject and attribute from recent context, or ask a targeted clarification when ambiguous. |
| How old is he? | Use explicit age or a supported birth date with a stated reference date; otherwise state that the source does not establish age. |
| Is he Argentine? | Require nationality evidence; a location in Argentina alone does not establish nationality. |
| What is the latest React release? | Use verified current public sources with links when web is available; report unavailability otherwise. |
| How can I improve this CV for a React role? | Cite facts from the CV and label recommendations as recommendations. A specific job comparison also needs the job description. |

## Bounded orchestration

1. Authorize the session and select permitted sources.
2. Load a bounded tail of server-owned conversation history, capped by turns and tokens.
3. Resolve the current question and source intent. Preserve the original wording. Ask for clarification if a unique referent or attribute cannot be recovered.
4. Retrieve from authorized source adapters; general conceptual questions can proceed without documentary retrieval.
5. Rank and assemble a bounded evidence context.
6. Generate source-specific claims, explanations, or recommendations.
7. Validate citation resolution and assess claim support; omit or qualify unsupported claims.
8. Save the response and a bounded diagnostic trace; render source labels and inspectable evidence.

History helps determine what the user means. Previous generated answers never become documentary evidence. The original question and resolved question should both be available for debugging. An inferred subject must be invalidated when its source is removed or the workspace expires.

## Delivery sequence

| Stage | Deliverable | Acceptance before moving on |
| --- | --- | --- |
| A | Versioned conversational challenge set and retrieval/generation trace | Separate standalone retrieval, follow-up resolution, claim support, and abstention metrics; include ES/EN, multiple people, topic switches, misleading yes/no questions, and deleted-source cases. Record baseline latency and provider calls. |
| B | Bounded contextualizer, source planner, clarification outcome, open general path | General questions work without files; follow-ups retain the correct subject; ambiguous questions ask for clarification; absent personal facts remain absent; unsupported provider modes fail clearly. |
| C | Atomic documentary claims and evidence assessment | Every claim points to its supporting source span. Tests distinguish nationality, residence, birthplace, and experience duration. A second model check is treated as fallible and evaluated against human labels. |
| D | Measured retrieval experiments | Compare BM25 plus existing embeddings against current ranking. Add reranking only if candidates contain the evidence but final ordering loses it. Adopt changes only when held-out quality improves without unacceptable latency or refusal regressions. |
| E | Optional web adapter and mixed-source responses | Public queries use links and retrieved page content; unavailable search cannot produce invented links. Queries do not automatically transmit CV text or personal details to a search provider. Retrieved web instructions are treated as untrusted content. |
| F | Durable public deployment prerequisites | Choose persistence, scheduled cleanup, abuse controls, and cross-instance coordination when public rollout is in scope. This proposal does not deploy the app. |

Stages A and B form the recommended first implementation. Stage C addresses factual precision. Stages D and E add capability with distinct quality and operational gates. Avoid setting an accuracy percentage before labeling and measuring the challenge set.

## Retrieval options and decision rules

- **BM25:** experiment with corpus frequency and passage length normalization in the lexical branch; tiny corpora may not benefit, so retain a baseline comparison.
- **Cross-encoder reranking:** score query/passage pairs after candidate retrieval. For very small passage sets, compare scoring all passages directly. Measure memory and response time as well as ranking quality.
- **Structure-aware passages:** preserve section headings and field/value relationships if evaluation finds parser or boundary misses; retain source offsets and version/rebuild affected indexes.
- **Small-file full context:** compare all passages only below a strict token budget. Large file limits do not imply that every file fits; more context can increase noise and cost.
- **Query expansion/decomposition:** use bounded variants for paraphrases or explicit multi-part questions. Preserve names and attributes, and avoid unbounded retries.
- **Graph retrieval and autonomous agents:** reconsider only when evaluations demonstrate relational or multi-step questions that the simpler pipeline cannot handle.

No new database is required for these local conversational improvements. A vector service would address operational scale, not conversational reference resolution or unsupported claims.

## Implementation ownership

| Module | Proposed responsibility |
| --- | --- |
| `src/lib/conversation-context.ts` (new) | Bounded server-owned history and reference resolution. |
| `src/lib/question-planner.ts` (new) | Validated intent, source policy, ambiguity, and resolved query. |
| `src/app/api/questions/route.ts` | Explicit orchestration, reservations, source availability, and save lifecycle. |
| `src/lib/retrieval.ts`, `semantic-search.ts`, optional reranker | Candidate selection and measured ranking strategies. |
| `src/lib/answer.ts`, optional evidence verifier | Source-specific generation and per-claim support checks. |
| `src/lib/web-search.ts` (future adapter) | Public search, fetched evidence, links, and retrieval timestamps. |
| `src/lib/types.ts`, `storage.ts` | Additive conversation outcomes, source references, backward compatibility, and lifecycle. |
| `src/app/workspace.tsx`, `i18n.ts` | General chat without files, clarification, source controls, and bilingual attribution. |
| `evals/` | Labeled conversational and claim-support regression cases, costs, and latency. |

Before parallel implementation, freeze shared types and lifecycle rules. Then assign disjoint modules to bounded workers and finish with independent integration review. Use one code-owned application pipeline; independent implementation reviewers do not imply multiple agents inside the product.

Suggested source contract: document references retain document ID, passage ID, and offsets; web references retain URL, title, retrieval time, and supporting excerpt; general explanations and recommendations have an explicit basis and do not invent documentary references. Keep internal diagnostic scores out of normal product copy. Do not display model relevance scores as probabilities of truth.

## Documentation changes when implemented

Update PRODUCT positioning, README behavior/provider setup, AGENTS orchestration, current diagrams, canonical task status, and CHECKLOG. Add requirements and acceptance IDs for the accepted stages before implementation. Document web processing and any provider configuration only once chosen. Keep current implemented behavior and future plans distinct.

## Proposal review and references

Two bounded read-only agents inspected the existing code. Requested profiles: Luna high for conversational architecture and Sol high for retrieval/evidence review. Both returned findings; runtime-confirmed model and effort were not exposed. Coordinator identity/effort also unconfirmed. This is planning evidence, not independent approval of future code.

- [Question-in-context rewriting](https://aclanthology.org/D19-1605/).
- [Retrieve and rerank, including small paragraph collections](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html).
- [Limitations of long-context evidence use](https://arxiv.org/abs/2307.03172).
