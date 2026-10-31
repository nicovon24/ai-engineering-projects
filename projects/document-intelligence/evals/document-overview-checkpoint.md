# Single-document overview retrieval checkpoint

## Cause and narrow change

On 2026-10-31, one local workspace contained a parsed two-page PDF with eight passages. The saved question `What is the file about` had status `insufficient_evidence` and zero retrieved passage IDs. `generateAnswer` returns that status immediately when retrieval is empty, before any Groq request. The question asks for a document overview but contains no useful source-specific lexical terms.

The retriever now recognizes a small set of generic English and Spanish overview phrasings when the workspace contains exactly one document. It deterministically samples up to five passages across that document, retaining original passage IDs and provenance. Other questions continue through lexical ranking; there is no general fallback that returns arbitrary text for a specific unanswered question. The path also works without an API key and presents sampled passages as evidence only in that mode.

## Observed checks

| Check | Observation |
| --- | --- |
| Synthetic single-page PDF | Five cases, including English and Spanish overview requests: recall@5 1.00, annotated precision 1.00, no-evidence empty retrieval 1/1. |
| Private two-page PDF | Both English and Spanish overview requests retrieved five passages; each found its one labeled passage. The labels and source text remain outside Git. |
| Existing hand-authored corpus | Eight cases: recall@5 0.83, annotated precision 0.64, empty retrieval 2/2, unchanged from its earlier baseline. |
| Existing parsed PDF/DOCX corpus | Eight cases: recall@5 0.67, annotated precision 0.67, empty retrieval 2/2, unchanged from its earlier baseline. |
| Local browser and Groq, synthetic PDF only | Playwright CLI uploaded the generated Project Orion PDF in a new workspace. The exact English question produced an English answer citing page 1; the Spanish overview produced a Spanish answer citing page 1. Both responses were inspectable in the UI. The synthetic workspace was deleted afterward. |

The private PDF and case files were used only by the keyless local parser and retriever. No Groq call was made with that document. Only the generated synthetic PDF was sent through the live Groq browser flow. The synthetic single-page example cannot establish how complete an overview of a long document will be. Sampling is source coverage, not semantic relevance ranking or a guarantee that a generated summary is correct. A previous saved insufficient-evidence answer remains in history; a new question is needed to exercise the updated retrieval path.

The observed miss on a separate specific English question about the private Spanish document remains. Cross-language retrieval and model answer evaluation are still DI-005/DI-006 work.
