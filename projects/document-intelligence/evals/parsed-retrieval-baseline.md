# Synthetic parsed-document retrieval baseline 1.0

Run from `projects/document-intelligence`:

```powershell
python evals/generate_format_fixtures.py
node evals/run-parsed-retrieval.mjs
```

The generated files remain under ignored `evals/fixtures/formats/`. The runner imports the application's `parseDocument` and `retrievePassages`, parses the generated PDF and DOCX through `File` inputs, resolves labels against the resulting passage text, and then retrieves from the parsed records. It uses no API key or model. Node.js 24.15.0 was used for this observation; the runner transpiles the app's TypeScript modules through the installed TypeScript package.

## Observed result, 2026-10-31

| Measure | Result | Denominator |
| --- | ---: | ---: |
| Parsed source documents | 2 | One generated PDF and one generated DOCX |
| Parsed passages | 2 | One per document |
| Answerable retrieval cases | 6 | Two English PDF, one Spanish DOCX, two cross-language, one mixed-file |
| Expected-passage recall@5 | 0.67 | Macro average over 6 answerable cases; 4 cases found all labeled passages |
| Annotated passage precision | 0.67 | Macro average over 6 answerable cases; only the explicitly labeled passages count as relevant |
| No-evidence empty-result rate | 1.00 | 2 of 2 English and Spanish cases |
| Local retrieval duration | Median 0.033 ms; p95 0.585 ms | One run after correcting the even-count median; 8 calls in one process; diagnostic only |

The one-page PDF produced one passage on page 1 with offsets 0–94 and ID `3262241ccfd48ea3e8cb3ab8`. The DOCX produced one passage with `page: null`, offsets 0–88, and ID `cddc4a474b50de98c1fdaf91`. The runner checked document IDs, page values, positive offsets matching passage length, expected extracted text, and stable passage IDs and offsets across two parses of each file.

Both cross-language questions returned no passage, although their labeled evidence was present in the other language. The mixed-file question retrieved both labeled passages. The two questions with no evidence returned empty lists. These are lexical retrieval outcomes, not answer refusal or citation quality measurements.

## Limits

The fixtures are short, generated, and contain one passage per file. They do not represent real PDF layouts, DOCX structures, scanned pages, long files, or a large search space. Precision is relative to the explicit labels in this small corpus; it is not exhaustive relevance judgment. Timing excludes fixture generation and parsing and does not predict application latency. No model answers were generated, so citation resolution, semantic claim support, answer-language quality, refusal, and model cost remain unmeasured. The existing hand-authored passage baseline is a separate evaluation and should not be combined with these scores.
