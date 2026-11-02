# Local evaluation material

`generate_format_fixtures.py` creates synthetic files under `fixtures/formats/` for the DI-002 intake review. The generated files are ignored by Git. They contain no personal or third-party documents.

Run `python evals/generate_format_fixtures.py` from the application directory. The set contains one-page, ten-page, and eleven-page text PDFs, a textless PDF, DOCX, MD, TXT, an empty TXT, malformed UTF-8, an unsupported CSV, and a file over 10 MB. The generator is not an evaluation result. Record observed app behavior and any parser limitations before marking DI-002 complete.

DI-005 still needs a permitted real DOCX, broader parser coverage, multi-file cases, and answer metrics.

Run `node evals/semantic-model-calibration.mjs` for the pinned multilingual model's small synthetic score checkpoint and `node evals/semantic-name-verification.mjs` for bounded nickname scoping cases. The [semantic retrieval review](../docs/features/03-answer-quality/01-semantic-retrieval/review.md) records the observed numbers, a private aggregate checkpoint, browser behavior, and limits. These scripts do not score generated claim support.

The first narrow retrieval corpus is now in `retrieval-cases.json`. Run `node evals/run-retrieval.mjs` to reproduce its keyless passage recall, annotated precision, empty-result, and local retrieval-timing baseline; see [retrieval-baseline.md](retrieval-baseline.md) for the observed result and limits. It does not yet cover model answers or document parsing.

The retrieval runner imports the TypeScript retrieval module directly and was checked with Node.js 24.15.0. Older Node.js versions may need a TypeScript runner.

[Representative source research](representative-sources.md) records candidate public PDF and DOCX documents, rights, and initial labeling ideas. It is a research note, not an observed parser or retrieval result.

Run `node evals/storage-verification.mjs` for the isolated DI-004 local storage checks. [Its report](storage-verification.md) states the observed results and the HTTP, provider, and multi-instance behavior it does not cover.

Run `python evals/generate_format_fixtures.py` and then `node evals/run-parsed-retrieval.mjs` for the [synthetic parsed PDF/DOCX baseline](parsed-retrieval-baseline.md). It exercises the application's parser and retriever but does not replace evaluation on representative documents.

Run `node evals/answer-contract-verification.mjs` for [mocked answer-contract checks](answer-contract-verification.md). This uses a synthetic key and mocked `fetch`; it does not call Groq or score semantic support.

Run `node evals/run-local-document.mjs --file <local-document-path> --cases <case-json-path>` for one keyless local PDF, DOCX, TXT, or MD document. [The runner guide](local-document-evaluation.md) explains private labeling and safe output. [The private-document checkpoint](private-document-baseline.md) records anonymous aggregate results from one real two-page PDF; neither the document nor its case file is in Git.

[The single-document overview checkpoint](document-overview-checkpoint.md) explains the previously observed generic-question miss, the narrow retrieval path, and checks using synthetic and private local files. The private document was not sent to Groq.
