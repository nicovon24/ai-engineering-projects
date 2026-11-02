# Hybrid semantic retrieval

Status: Implemented for the local prototype; evaluation remains narrow. Public persistence and broad quality claims are outside this feature.

## Objective

Find relevant source passages when a question uses related wording rather than identical words, while preserving session isolation, inspectable citations, and explicit insufficient-evidence outcomes. The motivating examples are `laburo` versus `trabajó` and a question about `Nico` over a file that names `Nicolás`.

## Observable acceptance

- **REQ-SEM-001 — Local embeddings:** A pinned multilingual model runs on the server. File passages and questions are embedded without sending their text to an embedding service. Long passages are represented beyond the model's token limit.
- **REQ-SEM-002 — Scoped index:** Each passage vector is tied to its document and passage ID under the temporary workspace. Existing files can be indexed on their first question. Removal and workspace expiry delete the corresponding vectors; a model-version change rebuilds stale indexes.
- **REQ-SEM-003 — Hybrid retrieval:** Specific questions combine lexical and semantic rankings, return at most five existing passage IDs, and retain the single-document overview path. Unrelated questions may return no passages. A failed embedding step falls back to lexical search with localized disclosure.
- **REQ-SEM-004 — Grounded names:** A bounded `Nico` to `Nicolás` search expansion applies only when the workspace contains `Nicolás`. The expansion is a search hint; documentary answers must not assert the nickname identifies the person unless the source says so.
- **REQ-SEM-005 — Evidence:** Compare the lexical baseline with synthetic Spanish, English, synonym, and unrelated questions and a private local document. Report case counts, retrieval hits, no-evidence behavior, model limits, and observed UI behavior. A retrieved ID remains a structural citation check, not proof of claim support.

## Boundary

This feature answers from uploaded files. It does not implement conversational reference resolution, general web search, OCR, semantic citation validation, a public database, or scheduled cleanup. The existing Groq answer and separate general-response boundaries remain in force.
