# DI-003 answer contract verification

Observed on 2026-10-31 with Node.js 24.15.0. From the Document Intelligence directory, run `node evals/answer-contract-verification.mjs`. The runner transpiles the current `answer.ts` and `errors.ts` into a temporary directory under `evals/`, replaces `globalThis.fetch` before any provider path is called, uses synthetic passages and a synthetic key, and removes the temporary directory afterward. It never sends a Groq request or prints an existing key.

The run exited 0 with 19 checks. `npm run lint`, `npm run typecheck`, and `npm run build` also exited 0. The answer module rejects contradictory status and claim combinations, trims claim text and rejects text that becomes empty, and maps malformed provider response JSON or a null response envelope to `provider_invalid_answer`.

| Contract | Observed result |
| --- | --- |
| No passages | Returns `insufficient_evidence` with no claims and no provider call, both with and without a configured key. |
| Passages without a key | Returns `evidence_only` with no claims and no provider call. |
| Explicit locale and source scope | Mocked provider request includes the selected `English (en)` or `Spanish (es)` instruction, the question, and the two supplied synthetic passages. The request uses `no-store`. |
| Structured answer and refusal | A valid cited answer preserves its claim and known passage ID. A valid provider refusal returns `insufficient_evidence` with no claims. |
| Claim text | Surrounding whitespace is trimmed from a valid claim. Whitespace-only text returns `provider_invalid_answer`. |
| Citation ID validation | Unknown IDs, including one mixed with a known ID, return `provider_invalid_answer`. |
| Invalid output | Unsupported status, contradictory status and claims, null or malformed provider envelope, and malformed model content return `provider_invalid_answer`. |
| Provider failures | HTTP 429 returns `provider_limited`; HTTP 503 and a transport exception return `provider_unavailable`. |

These checks exercise `generateAnswer` directly with a mocked fetch. The question Route Handler, persistence, and browser rendering are outside this runner. A known citation ID only proves that the passage was among retrieved inputs; it does not establish that the passage supports the claim. Actual model refusal, bilingual writing, semantic claim support, latency, and provider cost remain unverified.
