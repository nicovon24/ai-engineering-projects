# Local evaluation material

`generate_format_fixtures.py` creates synthetic files under `fixtures/formats/` for the DI-002 intake review. The generated files are ignored by Git. They contain no personal or third-party documents.

Run `python evals/generate_format_fixtures.py` from the application directory. The set contains one-page, ten-page, and eleven-page text PDFs, a textless PDF, DOCX, MD, TXT, an empty TXT, malformed UTF-8, an unsupported CSV, and a file over 10 MB. The generator is not an evaluation result. Record observed app behavior and any parser limitations before marking DI-002 complete.

DI-005 still needs representative parsed documents, labeled answer expectations, and broader retrieval and answer metrics.

The first narrow retrieval corpus is now in `retrieval-cases.json`. Run `node evals/run-retrieval.mjs` to reproduce its keyless passage-recall and empty-result baseline; see [retrieval-baseline.md](retrieval-baseline.md) for the observed result and limits. It does not yet cover model answers or document parsing.

The retrieval runner imports the TypeScript retrieval module directly and was checked with Node.js 24.15.0. Older Node.js versions may need a TypeScript runner.
