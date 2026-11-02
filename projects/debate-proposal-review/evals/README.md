# Evaluation and integration checks

All committed fixtures are locally authored and explicitly fictional. They do not represent real pilot outcomes or broad document compatibility.

The [2026-11-02 checkpoint](results-2026-11-02.md) reports completed bilingual live workflows, six-case label agreement of 5/6 Spanish and 4/6 English, and independently observed semantic limitations.

## Deterministic checks

`npm test` covers review contracts, transport errors, digital extraction, storage concurrency, workflow stages, and HTTP operations. Model doubles isolate application behavior from provider variability. The unit and service tests do not prove semantic support.

For a browser-to-disk check, run `node evals/synthetic-provider.mjs` and start the app on port 3302 with `GROQ_BASE_URL=http://127.0.0.1:8767`, a synthetic key, and an isolated `DPR_DATA_DIR`. Execute `playwright-cli run-code --filename=tests/browser-integration.js`. The script exercises consent, chat, upload, a simulated 429, retry, citations, persisted/corrected decisions, language change, mobile layout, and deletion. Do not point this test at real user records.

## Explicit live checks

`node evals/provider-health.mjs openai/gpt-oss-20b` (or `openai/gpt-oss-120b`) checks model availability and performs one small synthetic structured-output call. It reports status, validation, token use, and safe rate-limit headers. It sends no review text and prints no API key. A successful result establishes connectivity at that moment, not capacity for a full staged review.

With the project's ignored `.env.local` configured, `node evals/live-review.mjs es` (or `en`) sends only the original fictional fixture through real Groq chat and all review stages. Diagnostic outputs remain ignored under `.data/evals/`; secrets and authorization headers are never recorded.

`node evals/evidence-check.mjs es` (or `en`) evaluates six fixed, locally labeled factual claims against synthetic source passages. The expected labels are versioned in `evidence-cases.json`. The runner records observed verdict labels and citations. Label agreement is a narrow checkpoint, not a general accuracy score. Missing counterargument coverage and open-question quality still need qualitative review and more varied cases.

## Provider references

The transport is based on [Groq's API reference](https://console.groq.com/docs/api-reference), [reasoning configuration](https://console.groq.com/docs/reasoning), and [structured output documentation](https://console.groq.com/docs/structured-outputs). Provider support was checked during implementation on 2026-11-02. Domain validation still runs after provider schema validation.
