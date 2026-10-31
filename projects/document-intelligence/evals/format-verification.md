# DI-002 synthetic format verification

Date: 2026-10-31. Local Next.js development server, Playwright CLI, and generated files from `python evals/generate_format_fixtures.py`. This is a narrow integration check using synthetic files, not a guarantee for arbitrary real-world documents.

| File | Expected | Observed |
| --- | --- | --- |
| `text-one-page.pdf` | Accept with page provenance | Accepted; one passage on page 1, offsets 0–90, 24-character passage ID. |
| `text-ten-pages.pdf` | Accept at the page limit | Accepted; 10 passages with pages 1–10 and increasing nonempty offsets within each page. |
| `notes.docx` | Accept text | Accepted; one passage with offsets 0–82. |
| `notes.md` | Accept UTF-8 text | Accepted; one passage with offsets 0–99. |
| `notes.txt` | Accept UTF-8 text | Accepted after rejected uploads, confirming those rejections did not consume a file slot. |
| `text-eleven-pages.pdf` | Reject over page limit | Rejected with the localized 10-page message. |
| `textless-one-page.pdf` | Reject textless PDF | Rejected with the localized apparent-scan message. This fixture is textless, not an image scan. |
| `oversized.txt` | Reject over 10 MB | Rejected with the localized size message. |
| `unsupported.csv` | Reject format | Rejected with the localized supported-formats message. |
| `empty.txt` | Reject empty file | Rejected with the localized empty-file message. |
| `invalid.txt` | Reject malformed UTF-8 | Rejected with the localized unreadable-file message. |

The accepted PDF/DOCX/MD records were inspected in local workspace JSON for passage count, page number where applicable, stable-shape ID, and nonempty offsets. Playwright CLI observed localized success or rejection messages. The synthetic workspace was manually deleted before the rejection checks; the second workspace remains local and temporary until manually deleted or expired on access.

## Limits of this check

- Real user PDFs, encrypted PDFs, complex DOCX layouts, tables, ligatures, and image-only scans need a separate representative corpus.
- The parser's offset is into extracted per-page text, not the PDF byte stream or a visual rectangle.
- Citation opening and authorized original download were verified previously with a synthetic TXT; this format check did not re-exercise those actions for every format.
- Question quality, semantic citation support, and cross-language retrieval belong to DI-005/DI-006.
