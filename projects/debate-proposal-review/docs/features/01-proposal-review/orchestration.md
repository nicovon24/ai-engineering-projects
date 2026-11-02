# Local MVP implementation plan

Agreed on 2026-11-02. Implementation status belongs only in `../../specs/tasks.md`.

## User journey

1. Open `/`, select a locale, and explicitly consent to external AI processing.
2. Discuss the proposal with the Groq-backed intake assistant and add authorized source text or TXT, MD, PDF, and DOCX files.
3. Edit the assistant's proposal summary and explicitly select Generate review.
4. Inspect the review at `/reviews/[id]`: competing arguments, factual claims, source passages, evidence limits, and open questions.
5. Save or correct a human approve/reject/defer decision with rationale, optional conditions, and timestamp.
6. Return through `/reviews`, or delete a review and its files. Local records remain until deletion.

## Implementation boundaries

| Module | Responsibility | Verification |
| --- | --- | --- |
| Review contract | Validate output shape, IDs, argument links, and review-scoped citations | Pure behavior tests with invalid and cross-review cases |
| Groq adapter | Bounded server-side JSON transport and stable errors | Injected transport tests; no secrets or network in ordinary tests |
| Intake and storage | Extract digital text, create stable passages, persist local review records | Format fixtures, malformed input, persistence, deletion, and concurrency tests |
| Chat and workflow | Clarification, editable summary, explicit generation, stage validation and retry | Fake model tests for consent, locale, failure, and stage ordering |
| Application routes | Chat homepage, history, review detail, source inspector and human decision | Playwright CLI user flows in Spanish/English and mobile/desktop |
| Evaluation | Assess semantic support separately from structural citation validity | Versioned labeled cases and recorded counts/limits |

The coordinator resolves shared contracts before delegating dependent modules. Workers own exclusive file paths and report failing-test evidence before implementation, passing-test evidence afterward, and remaining limitations. The coordinator owns shared documents and integration. An independent reviewer examines the integrated change and acceptance criteria.

## Model requests and observed execution

| Role | Requested model | Requested effort | Runtime-confirmed identity/effort |
| --- | --- | --- | --- |
| Planning and coordination | `gpt-6-astra` | medium | unconfirmed |
| Focused provider research | `gpt-6-luna` | high | unconfirmed |
| Implementation | `gpt-6-sol` | medium | unconfirmed |
| Independent review | `gpt-6-sol` | high | unconfirmed |

Observed delegation: `provider_research` inspected the existing DI Groq boundary read-only; `review_contract` implemented contracts, intake/storage, and the chat-first UI in separate bounded assignments; `groq_adapter` implemented transport, staged workflow, and HTTP operations and ran synthetic live checks; `independent_review` reviewed acceptance and rendered output. The coordinator integrated modules, tested browser-to-disk behavior, maintained diagrams and documentation, and fixed the demonstrated local-origin regression with TDD. Model requests do not establish effective runtime identity. No more than two workers run concurrently.

## Diagram plan

Create documentation-wide architecture, workflow, and data diagrams under `system-design/` as standalone SVG, with the local DESIGN.md palette. The project generator emits SVG directly. Distinguish implemented components from planned ones. Keep the overview within nine nodes and move claim/citation details into a separate figure. Diagrams are documentation artifacts, not evidence that an application capability is implemented.
