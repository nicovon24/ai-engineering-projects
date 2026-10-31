# Local document retrieval evaluation

Run from `projects/document-intelligence` with Node.js 24 and installed project dependencies. The runner imports the application's `parseDocument` and `retrievePassages` functions. It makes no model or provider request and needs no API key. It accepts one PDF, DOCX, UTF-8 TXT, or UTF-8 MD file at a time.

```powershell
node evals/run-local-document.mjs --file <local-document-path> --cases <case-json-path>
```

`--cases` is optional. With only `--file`, the runner reports the extension, PDF page count (or `null`), passage count, and sum of passage character lengths. Passage overlap can make that sum larger than the distinct extracted text length. The application's parser enforces the 10 MB file, 10 PDF page, 500,000 extracted character, and usable-text limits. The runner also checks file size before reading it.

The case JSON has a `cases` array and an optional `version`; a UTF-8 BOM at the start is accepted. Each case has a unique nonempty `id`, a `locale` of `es` or `en`, a nonempty `question`, and an `expectedEvidence` array. Each expected evidence label has a nonempty `contains` string, an optional one-based PDF `page`, and an optional zero-based `passageIndex` into the parsed document's passage array. Without `passageIndex`, a label must match exactly one parsed passage, including its page when specified. Zero or multiple matches fail with `evidence_label_not_unique`. With `passageIndex`, the indexed passage must exist and contain the substring and match the page when specified; otherwise the runner returns `evidence_label_mismatch`. Invalid indices fail with `invalid_evidence_label`. Each error uses a generated case reference without printing the label or source. Two labels that identify the same passage fail with `duplicate_evidence_label`.

```json
{
  "version": "example-1",
  "cases": [
    {
      "id": "case-1",
      "locale": "en",
      "question": "Where is the metadata stored?",
      "expectedEvidence": [{ "contains": "metadata in PostgreSQL", "page": 1 }]
    },
    {
      "id": "case-2",
      "locale": "es",
      "question": "¿Cuál es el salario?",
      "expectedEvidence": []
    }
  ]
}
```

If parser overlap makes a phrase appear in more than one passage, add `"passageIndex": 1` to the relevant evidence label to select the second parsed passage. The index refers to passage order for this exact file and parser version; check labels again after changing the document or chunking code.

The JSON report uses opaque sequential IDs (`case-001`, `case-002`, and so on) in input order. Errors use the same reference, so input case IDs and the version never appear in stdout or stderr. Use the input order to map results back to private labels. The report contains counts, but no source text, filename, path, question, evidence substring, or passage ID. The runner gives the parser a generic filename so private filenames do not influence lexical ranking. Keep private case JSON and documents outside version control.

For each answerable case, `recallAt5` is labeled passages retrieved in the top five divided by labeled passages. `annotatedPrecision` is labeled passages retrieved divided by all passages retrieved. Both aggregate scores are macro averages over answerable cases. For a case with no expected evidence, `noEvidenceCorrect` is true when retrieval is empty; `noEvidenceAccuracy` is its mean over such cases. A metric with no applicable cases is `null`. Timing covers only each synchronous retrieval call, with median and nearest-rank p95 in milliseconds. It excludes file read, parsing, and any answer generation.

## Synthetic checkpoint, 2026-10-31

The fixture is generated locally and ignored by Git:

```powershell
python evals/generate_format_fixtures.py
node evals/run-local-document.mjs --file evals/fixtures/formats/eval-architecture.pdf --cases evals/local-evaluation-example.json
```

Originally observed with one generated PDF page and three cases: one passage, 94 passage characters, two answerable cases, one no-evidence case, recall@5 **1.00**, annotated precision **1.00**, and no-evidence accuracy **1.00**. Retrieval median was **0.418 ms** and p95 **0.561 ms** in that run. `npx eslint evals/run-local-document.mjs` exited 0. The example corpus now also includes English and Spanish overview cases; see [the newer checkpoint](document-overview-checkpoint.md) for its five-case result.

A separate synthetic privacy check used PII-looking input ID and version strings and a BOM-prefixed cases file. Neither input string appeared in stdout or stderr on successful or failed label resolution; the runner emitted `case-001` instead.

## Synthetic overlap checkpoint, 2026-10-31

This PowerShell example generates one temporary text file with a phrase in the 100-character overlap between the parser's first two passages. The temporary files live in the ignored synthetic fixture directory.

```powershell
$fixture = 'evals/fixtures/formats/local-overlap.txt'
$cases = 'evals/fixtures/formats/local-overlap-cases.json'
[IO.File]::WriteAllText((Join-Path (Get-Location) $fixture), ('a' * 780 + ' sharedanchor ' + 'b' * 200))
$case = @{ cases = @(@{ id = 'synthetic-overlap'; locale = 'en'; question = 'sharedanchor'; expectedEvidence = @(@{ contains = 'sharedanchor'; passageIndex = 1 }) }) }
[IO.File]::WriteAllText((Join-Path (Get-Location) $cases), (ConvertTo-Json -InputObject $case -Depth 8))
node evals/run-local-document.mjs --file $fixture --cases $cases
Remove-Item -LiteralPath $fixture, $cases
```

Observed: two parsed passages; the phrase matched both, so the same label without `passageIndex` returned `evidence_label_not_unique`. With `passageIndex: 1`, recall@5 was **1.00** and annotated precision **0.50** because both passages were retrieved but only one was labeled. An out-of-range index returned `evidence_label_mismatch` with `case-001`. The targeted ESLint check and the original synthetic PDF example both passed after this change.

This example verifies only the runner and a short synthetic PDF. It does not establish broad format compatibility, exhaustive relevance labels, semantic citation support, answer quality, refusal behavior, or representative latency. Precision is relative to the supplied labels. A no-evidence case measures empty retrieval, not a model refusal. One-file runs cannot measure multi-file retrieval; use the parsed corpus runner for that checkpoint.
