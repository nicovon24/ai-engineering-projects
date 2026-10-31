# Document Intelligence

## Problem

Document RAG with verifiable citations and explicit insufficient-evidence handling.

## Target user

A person working on personal projects who wants to ask questions about their own files and inspect the source of each answer. The application is also a demonstrable AI Engineering project: its design, evaluation cases, and technical decisions should be explainable in interviews.

## Intended demo

A visitor to the public demo uses a temporary anonymous workspace to upload up to three text-based PDFs of up to 10 pages each, text files, or Word documents, with a 10 MB limit per file; asks up to ten questions across those files in Spanish or English; opens the exact document and passage behind each citation; and sees a clear insufficient-evidence answer when the files do not support a claim. The visitor can delete the workspace immediately. Access expires 24 hours after the last successful upload or question; reading or downloading does not extend it. The public version must delete files, passages, questions, and answers on that schedule. Scanned PDFs receive a clear unsupported-input message in the first public version. Document isolation, automatic cleanup, and abuse controls are required before public release.

## MVP scope

Accept up to three files of at most 10 MB each in one temporary workspace: text-based PDFs up to 10 pages each, UTF-8 `.txt` and `.md` files, and `.docx` documents. Allow up to ten questions per workspace and show a localized limit-reached state. Validate file type and size on the server; state the limits in the UI. Extract text with page and span provenance where the format provides it, index passages, retrieve relevant passages across the workspace, produce cited answers, validate that every citation resolves to its source document and passage, and return an explicit insufficient-evidence result when support is missing. Support Spanish and English throughout the UI and answer flow. Detect scanned PDFs before accepting them into the workspace, show a clear localized explanation, and do not count rejected files toward the three-file limit. Add OCR in a later milestone before claiming support for scanned PDFs.

## Architecture

Independent Next.js App Router and TypeScript application. Server Components read document and answer state; Server Actions handle uploads and deletes authorized for the visitor's anonymous workspace; a Route Handler streams answers when implemented. A server-issued, unguessable session identifier scopes every document read, retrieval, and deletion. Add a Python document worker only if parsing quality or workload justifies it; durable jobs will handle long ingestion.

## Data requirements

User-provided PDFs of at most 10 pages, UTF-8 text files, and `.docx` documents; rights to process them; temporary workspace ownership; last successful upload or question and expiration timestamps; deletion metadata; stable source offsets or section anchors; and a small labeled question set. Expire files, extracted passages, indexed data, and question and answer history together 24 hours after the last successful upload or question. Include both answerable and unanswerable questions in Spanish and English. Include a text PDF, a scanned PDF, and a Word document in the evaluation corpus so format behavior is visible.

## Model and tool choices

Start with a replaceable local retrieval and answer interface that runs without an API key. For the public demo, prefer an application-owned Groq API key kept only on the server, with a model chosen after evaluating answer quality and current limits. Visitors do not supply keys. Send only retrieved passages needed for a question, explain this external processing before upload, and enforce per-workspace and global request limits, token limits, and graceful handling of provider rate limits. Timed background deletion 24 hours after the last successful upload or question is required before public release; the current local prototype rejects expired workspaces on access and supports manual deletion. Provider-side retention follows separate controls and must be disclosed accurately. The provider is replaceable; citing a passage still requires independent validation.

## Memory if applicable

Indexed source documents are distinct from conversation history; do not treat a chat summary as evidence.

## Evaluation plan

Measure retrieval recall, citation resolution to the correct document and passage, whether cited passages actually support answer claims, refusal on unanswerable questions, Spanish and English behavior, latency, and cost using versioned cases. Include cases requiring evidence from more than one file. Keep citation resolution and semantic support as separate checks. Record a short learning log for architectural decisions and failed approaches so the project can be explained in interviews.

## Risks

Unsupported citations, prompt injection inside documents, accidental cross-visitor retrieval, parsing errors, scanned PDFs without extractable text, oversized uploads, unbounded public usage, and retention of private files.

## References and original approach

These repositories are learning references, not specifications or sources of project claims. Review each repository's current code and license before reuse. Do not copy another author's code, prompts, interface, branding, assets, or reported results without appropriate permission and attribution.

| Reference project and exact URL | What to study | Relationship | What this implementation will do differently | License and attribution questions before reuse |
| --- | --- | --- | --- | --- |
| [RAG Citation Agent](https://github.com/ramiro-c/rag-citation-agent) | Citation validation and retrieval fallback. | Direct | Build a bilingual document workspace with auditable passage IDs, explicit abstention, and independently measured citation support. | Check the repository and relevant file or asset licenses, third-party dependencies, prompt and data provenance, attribution requirements, and whether reuse is permitted. |
| [YouTube Transcript RAG](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/rag_apps/youtube_transcript_rag) | Ingestion, embeddings, persistence, and source links. | Technical analogy | Build a bilingual document workspace with auditable passage IDs, explicit abstention, and independently measured citation support. | Check the repository and relevant file or asset licenses, third-party dependencies, prompt and data provenance, attribution requirements, and whether reuse is permitted. |

## Status

In progress as a local prototype. The bilingual interface has a responsive document conversation layout, local shadcn/ui controls, and persistent light/dark themes. File intake, lexical retrieval, evidence-only mode without a key, optional server-side Groq answers, structural citation ID checks, atomic question quota reservations, and manual deletion are implemented locally. Synthetic format and parsed PDF/DOCX retrieval checks, a private real-PDF retrieval checkpoint, mocked answer-contract checks, and one-process storage checks are documented under `evals/`; they do not establish broad parser compatibility, semantic citation support, or actual model quality. Automatic background cleanup, global abuse controls, and production persistence are not implemented.

## Run locally

From this directory, run `npm install` and `npm run dev`. The application starts without API keys and shows matching source passages without an AI-generated answer. To try optional Groq answers locally, set `GROQ_API_KEY` in `.env.local`; keep the key server-side. No database is required for this local prototype. Workspace data is stored in the ignored `.data/` directory.

## Working documents

Read [CHECKLOG.md](CHECKLOG.md) for recent context, [docs/specs/tasks.md](docs/specs/tasks.md) for task status, [document Q&A requirements](docs/features/document-qa/requirements.md), and [UI V2 design and review](docs/features/workspace-ui-v2/review.md) before resuming implementation. The [public-readiness requirements](docs/features/public-demo-readiness/requirements.md) remain planned.

## Next steps

Improve the observed English-query retrieval miss and compare against the existing synthetic and private cases. Add a permitted real DOCX and measure semantic citation support in Spanish and English. Before a public demo, add persistent database and object storage, scheduled deletion, global abuse controls, cross-instance quota enforcement, and provider evaluation. OCR for scanned PDFs is a later milestone.
