# Hybrid retrieval review

## Implemented checkpoint

The local prototype embeds questions and token-safe passage windows with a pinned multilingual model. It persists versioned vectors inside each temporary workspace, reindexes missing or stale vectors, fuses lexical and semantic rankings, and selects at most five existing passage IDs. Upload and question processing retain lexical retrieval when embedding fails. The UI labels that fallback in the selected language. No database or embedding API is required locally.

The bounded `Nico` search hint can find `Nicolás` when source text supports that candidate. Literal `Nico` passages take priority. Explicit full-name links permit matching passages in another uploaded file; name boundaries prevent prefix-surname matches. When the source does not establish the nickname identity, generated claims must begin conditionally and cannot assert `Nico` in the rest of the claim. This is a narrow heuristic, not general entity resolution.

## Observed evaluation

| Check | Result | Limit |
| --- | --- | --- |
| Pinned-model synthetic calibration | `laburo`/`trabajó` cosine 0.283; English work synonym 0.401; two unrelated questions had maximum 0.154 and 0.093. Threshold set to 0.25. | Few hand-authored passages and questions; score is not a universal relevance estimate. |
| Existing hand-authored retrieval cases | The expected passage ranked first in 5 single-target cases; a two-file case placed both expected passages in the top three; two unrelated cases scored below threshold. | Model ranking calibration, not a complete hybrid end-to-end metric. |
| Private two-page PDF | A local, ignored checkpoint found a relevant top-five passage for 6/6 labeled answerable questions and empty retrieval for 2/2 no-evidence questions. No document text was printed, committed, or sent to Groq for this check. | One private document, eight questions, and a local approximation of token-window ranking. The earlier lexical checkpoint was 5/6 answerable and 2/2 no-evidence on this file. |
| Targeted nickname and answer checks | Ambiguous names, same-file and cross-file explicit links, parenthesized links, and surname-prefix separation passed. Mocked answer-contract runner passed 24 checks, including conditional nickname wording. | Mocked generation does not establish actual claim support. |
| Browser flow on port 3300 | A synthetic TXT upload produced a persisted 384-dimensional vector index. A synonym question produced a cited answer, and `¿Quién es Nico?` produced conditional wording with a source citation. Workspace deletion removed the synthetic file and vector directory. | One local Groq interaction and one synthetic file; it does not measure broad response quality. |

`npm run typecheck`, `npm run lint`, and `npm run build` passed on the integrated implementation. The model calibration and targeted Node verification commands passed. The production build and final verification were rerun after the nickname corrections.

## Review findings and remaining work

An independent read-only reviewer found and rechecked quota and reservation ordering, nickname assertions, and cross-file scope. Final review identified a missed `Nicolás (Nico) Ruiz` link and a surname-prefix match; both were corrected with targeted tests. Requested reviewer profile: Sol high. Runtime-confirmed model and effort: unconfirmed. Requested embedding implementer profile: Sol medium. Runtime-confirmed model and effort: unconfirmed. The coordinator runtime model and effort were also not exposed for confirmation.

This checkpoint verifies retrieval IDs and narrow behavior, not whether each generated claim is semantically supported by its citation. DI-005 still needs a larger labeled multilingual and multi-file corpus with representative PDF/DOCX layouts and false-positive analysis. DI-006 still needs independent claim-support, refusal, latency, and cost scoring. Public use also needs durable storage, scheduled expiry, and cross-instance controls.
