# Lexical retrieval baseline 1.0

Date: 2026-10-31. Command: `node evals/run-retrieval.mjs` from the application directory. The runner calls the current `retrievePassages` function against `retrieval-cases.json`; it does not call Groq or process private files.

Observed result: **8 synthetic cases**, including 6 answerable and 2 intentionally unsupported questions. Expected-passage recall at five was **0.83 (5 of 6 cases met their expected passage set)**. Both unsupported questions returned no passages (**2 of 2**). These rates describe only this small synthetic corpus and are not a general quality estimate.

The Spanish question “¿Dónde se guardan los metadatos?” failed to retrieve the English passage about metadata. Same-language Spanish and English questions and the two-file English question found their expected passages. Some questions retrieved additional, potentially irrelevant passages, so recall alone does not measure precision or answer support.

Next, add real permitted text PDFs and DOCX files with labeled passage and answer expectations; score precision, abstention, latency, claim support, and cost separately. Do not choose embeddings solely from this one cross-language failure: compare a bilingual lexical or hybrid baseline first.
