# Document question answering design

## Current pipeline

The [project agent guide](../../../AGENTS.md) contains the current upload and question flow diagrams. The implementation is a bounded pipeline, not a multi-agent system:

1. A Server Action validates and parses a file, creates page or offset linked passages, attempts local embeddings, and writes the original, optional versioned vectors, and workspace JSON under ignored `.data/workspaces/`.
2. A Route Handler authorizes a question with the HttpOnly workspace token, prepares local query and passage vectors, then reserves one of ten slots under a local workspace lock. A failed embedding step keeps lexical retrieval available.
3. With a Groq key, a bounded rewrite receives only the question and locale. Specific questions fuse lexical and local semantic rankings, selecting up to five passages; no-key mode uses the same local hybrid search. A single-document overview request samples representative passages. Groq then receives the selected locale and passages for a documentary answer.
4. Zod validates response shape; code checks every cited ID against retrieved passages. A documentary abstention may add a separate general response, restricted to an explicit set of educational concepts; other questions receive a fixed verification limit. The general call receives only the question. Its failure does not discard documentary abstention. Under the lock, storage checks that source IDs still exist before saving and consuming the reservation.
5. The Server Component sends only public workspace fields to the client. The client shows claim-level citations and the exact extracted passage.

## Contracts and decisions

| Decision | Current contract | Reason or limitation |
| --- | --- | --- |
| Local persistence | Original bytes and JSON live in `.data/workspaces/`; random token in an HttpOnly cookie selects the workspace. | Runs without a database or API key. A multi-instance public deployment needs database metadata and object storage. PostgreSQL is recommended but not installed. |
| Source identity | A passage ID hashes document ID, page, offsets, and text. PDF passages carry page numbers; DOCX/TXT/MD passages have extracted-text offsets. | IDs and offsets make sources inspectable. A real ID alone does not prove semantic support. |
| Retrieval | Lexical term overlap and local multilingual vector similarity are fused for specific questions, returning at most five passages. A narrowly recognized overview request over exactly one document samples passages in source order. | Keyless and scoped to the current workspace. The initial similarity threshold has narrow calibration; retrieval and citation IDs do not prove claim support. A failed embedding step uses labeled lexical fallback. |
| Bilingual query expansion | When Groq is configured, send only the question and selected locale to obtain up to three bounded English/Spanish search phrases. Merge their lexical rankings with the original question before fusion with local semantic matches. | Keeps the source text out of the rewrite call. An invalid or failed rewrite falls back to the original local retrieval; no-key mode remains keyless. The answer call receives only selected passages. |
| Generation | One Groq model call receives the locale, question, and retrieved passages; the key stays server-side. | Model output is structured but still untrusted. Unknown citation IDs are rejected. |
| General fallback | If no retrieved passages support an answer, keep the documentary insufficient-evidence outcome and optionally add a separately labeled response with no document citations. Generated general text is limited to an explicit small list of educational concepts, such as RAG, retrieval, OCR, SQL, and photosynthesis. Other questions receive a fixed verification limit. | General information is not documentary evidence. The fixed topic gate and output filters reduce personal/current claims but do not establish semantic truth. Existing question records without this optional field continue to render. |
| Quota | Short-lived reservations count with saved questions. Reservations are stored in workspace JSON and expire after two minutes. | Prevents parallel local requests from bypassing the ten-question limit; this is not cross-instance coordination. |
| Retention | Successful upload or saved question renews 24-hour access. Reads, downloads, and document removal do not. Expired workspaces are deleted on access; manual deletion is immediate. | Scheduled background deletion is required before public use. Provider retention is a separate policy. |

Conversation history is the saved question list. Execution state includes pending reservations. Indexed source passages are evidence. This feature has no curated long-term memory. Document text is untrusted input and must never override application instructions.

## Rejected shortcuts and open decisions

- Do not equate a valid passage ID with a supported claim. Evaluate semantic support on labeled cases and retain human review for ambiguous claims.
- Do not add specialist agents merely to call the existing stages; evaluate the simple pipeline first.
- Do not claim support for scanned PDFs until OCR is implemented and evaluated.
- Do not use sampled overview passages as a fallback for specific questions; specific-question candidates must pass lexical matching or the calibrated semantic threshold.
- Choose a public persistence provider and scheduled cleanup mechanism only when preparing a concrete deployment; local development must remain usable without cloud credentials.
