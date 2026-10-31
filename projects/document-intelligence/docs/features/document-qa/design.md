# Document question answering design

## Current pipeline

The [project agent guide](../../../AGENTS.md) contains the current upload and question flow diagrams. The implementation is a bounded pipeline, not a multi-agent system:

1. A Server Action validates and parses a file, creates page or offset linked passages, and writes the original plus workspace JSON under ignored `.data/workspaces/`.
2. A Route Handler authorizes a question with the HttpOnly workspace token and reserves one of ten slots under a local workspace lock.
3. Lexical retrieval selects up to five passages from that workspace. With no Groq key, the result is labeled evidence only. With a key, Groq receives the selected locale and passages and returns structured claims.
4. Zod validates response shape; code checks every cited ID against retrieved passages. Under the lock, storage checks that source IDs still exist before saving and consuming the reservation. Failure releases the slot.
5. The Server Component sends only public workspace fields to the client. The client shows claim-level citations and the exact extracted passage.

## Contracts and decisions

| Decision | Current contract | Reason or limitation |
| --- | --- | --- |
| Local persistence | Original bytes and JSON live in `.data/workspaces/`; random token in an HttpOnly cookie selects the workspace. | Runs without a database or API key. A multi-instance public deployment needs database metadata and object storage. PostgreSQL is recommended but not installed. |
| Source identity | A passage ID hashes document ID, page, offsets, and text. PDF passages carry page numbers; DOCX/TXT/MD passages have extracted-text offsets. | IDs and offsets make sources inspectable. A real ID alone does not prove semantic support. |
| Retrieval | Case-normalized lexical term overlap, top five passages. | Deterministic and keyless. Cross-language questions may miss evidence; measure this before adding multilingual embeddings or another approach. |
| Generation | One Groq model call receives the locale, question, and retrieved passages; the key stays server-side. | Model output is structured but still untrusted. Unknown citation IDs are rejected. |
| Quota | Short-lived reservations count with saved questions. Reservations are stored in workspace JSON and expire after two minutes. | Prevents parallel local requests from bypassing the ten-question limit; this is not cross-instance coordination. |
| Retention | Successful upload or saved question renews 24-hour access. Reads, downloads, and document removal do not. Expired workspaces are deleted on access; manual deletion is immediate. | Scheduled background deletion is required before public use. Provider retention is a separate policy. |

Conversation history is the saved question list. Execution state includes pending reservations. Indexed source passages are evidence. This feature has no curated long-term memory. Document text is untrusted input and must never override application instructions.

## Rejected shortcuts and open decisions

- Do not equate a valid passage ID with a supported claim. Evaluate semantic support on labeled cases and retain human review for ambiguous claims.
- Do not add specialist agents merely to call the existing stages; evaluate the simple pipeline first.
- Do not claim support for scanned PDFs until OCR is implemented and evaluated.
- Choose a public persistence provider and scheduled cleanup mechanism only when preparing a concrete deployment; local development must remain usable without cloud credentials.
