# Lexical retrieval baseline 1.0

Date: 2026-10-31. Command: `node evals/run-retrieval.mjs` from the application directory. The runner calls the current `retrievePassages` function against `retrieval-cases.json`; it does not call Groq or process private files.

Observed result: **8 synthetic cases**, including 6 answerable and 2 intentionally unsupported questions. Macro expected-passage recall at five was **0.83** (five of six answerable cases retrieved all expected passages). Macro annotated passage precision was **0.64** across the six answerable cases; a case with no retrieved passages scores zero. Both unsupported questions returned no passages (**2 of 2**). These rates describe only this small synthetic corpus and are not a general quality estimate. The expected-passage labels are exhaustive only within this synthetic set, so the precision score should not be interpreted as human relevance judgment on real documents.

The runner also reports per-case retrieval duration and a local median and p95. On Node.js 24.15.0, one run after correcting the even-count median reported **0.080 ms median and 1.067 ms p95** for these eight tiny in-memory queries. These are diagnostic timings, not user-visible latency or a performance target; they exclude parsing, storage, network, and model time, and vary across runs.

The Spanish question “¿Dónde se guardan los metadatos?” failed to retrieve the English passage about metadata. Same-language Spanish and English questions and the two-file English question found their expected passages. Some questions retrieved additional, potentially irrelevant passages, so recall alone does not measure precision or answer support.

Next, add real permitted text PDFs and DOCX files with labeled passage and answer expectations; score abstention, claim support, and model cost separately. Do not choose embeddings solely from this one cross-language failure: compare a bilingual lexical or hybrid baseline first.
