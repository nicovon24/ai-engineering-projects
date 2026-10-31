# Private local document checkpoint

## Scope and privacy

On 2026-10-31, the local evaluation runner processed one user-provided, text-based Spanish PDF with two pages. The document, its path, extracted text, questions, and evidence labels remain outside version control. The runner used the application's parser and lexical retriever. No model or provider request was made, and no API key was needed.

The private case file is stored under the application's ignored `.data/evals/` directory. Do not commit the document or case file. This report contains only aggregate results and anonymous case numbers.

## Observed results

| Measure | Result |
| --- | ---: |
| Parsed passages | 8 |
| Evaluation cases | 8 |
| Answerable cases | 6 |
| No-evidence cases | 2 |
| Macro recall@5 | 0.83 (5 of 6 labeled passages found) |
| Macro annotated precision | 0.32 |
| Empty retrieval for no-evidence cases | 2 of 2 |
| Retrieval-only median / p95 | 0.31 ms / 1.49 ms |

One English-language question, `case-006`, retrieved no passage despite a labeled source passage. The other five answerable cases retrieved their labeled passage. The timing values are from one local run; they exclude file read, parsing, network calls, and answer generation.

## Interpretation and next check

The corpus labels one passage per answerable case. Overlapping chunks can contain the same supporting phrase, so the annotated precision is conservative and should not be interpreted as a fully judged relevance score. The observed miss is evidence that lexical retrieval needs stronger cross-language handling. The two empty-retrieval cases check retrieval behavior only; they do not prove model refusal.

This is a single private document, not a representative PDF compatibility study. A permitted real DOCX, a textless PDF case, multi-file cases, and semantic answer and citation-support review remain open under DI-005/DI-006. After changing retrieval, rerun the same private cases and the public synthetic corpora, then compare recall and false-positive behavior before claiming improvement.
