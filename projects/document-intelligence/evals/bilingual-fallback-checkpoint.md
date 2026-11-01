# Bilingual retrieval and general fallback checkpoint

Date: 2026-10-31. Scope: a local prototype, synthetic provider responses, and one synthetic PDF in a live local browser session. No private user document was sent to Groq.

## Focused contract checks

`node evals/bilingual-fallback-verification.mjs` passed 27/27 synthetic checks. They cover a keyless rewrite path, bounded Spanish/English phrases, question-and-locale-only rewrite payload, configured Groq base URL, invalid or failed rewrite fallback, an English-to-Spanish lexical recovery, the five-passage ceiling, separate general-answer schema, question-only general payload, and fixed refusals for selected personal, market, and unknown-topic questions. Mocked general text with a document attribution, passage marker, current office holder, price, or personal earnings is screened. The test does not prove that Groq always chooses correct phrases or that every generated sentence is true.

The original answer-contract runner passed 19/19 checks. The hand-authored lexical corpus remained at recall@5 0.83, annotated precision 0.64, and empty retrieval 2/2. The parsed synthetic PDF/DOCX corpus remained at recall@5 0.67, annotated precision 0.67, and empty retrieval 2/2. These baseline runners exercise the keyless lexical function, not live query rewriting.

## Live local browser observation

Playwright CLI opened the running Next.js app with the existing server-side Groq configuration. It uploaded only `evals/fixtures/formats/eval-architecture.pdf`, a generated one-page PDF. A Spanish question about where Project Orion stores metadata received a Spanish answer naming PostgreSQL with a citation to page 1 of that PDF. A Spanish photosynthesis question, absent from the PDF, displayed the documentary insufficient-evidence message followed by a separately labeled general explanation without a document citation. The English switch translated the surrounding interface, and the separate section remained visible at a 390 px viewport. The synthetic workspace was deleted through the UI afterward. This is a two-question observation, not a model-quality score.

## Remaining limits

- The allowed general topics are deliberately narrow. Other questions receive a fixed verification limit, not an arbitrary Groq-generated answer.
- Citation ID validation proves that a cited passage was retrieved, not that it semantically supports a claim. DI-006 must evaluate that distinction and check generated general text for unsupported extra claims.
- Query rewriting quality, provider latency and cost, broad real-document compatibility, and refusal rates have not been measured on a representative corpus.
- No web search or live-data source is connected; current facts are not verified in real time.
