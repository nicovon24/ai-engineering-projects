# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router and TypeScript, as specified for this repository. Groq is the intended hosted model provider; the local application must start without an API key.

## Users

Visitors exploring a public portfolio project and people asking questions about their own personal project documents. The owner is learning AI Engineering and wants to explain the system, its evaluations, and tradeoffs in interviews.

## Product Purpose

Help a visitor ask questions about their own files, inspect the passages behind an answer, and recognize when the files do not contain enough evidence.

## Positioning

Each answer is tied to inspectable passages from the visitor's temporary document workspace. Claims without enough support should be withheld rather than filled from general model knowledge.

## Operating Context

A visitor uses a temporary anonymous workspace, uploads up to three files, asks up to ten questions, and may delete the workspace immediately. Access expires 24 hours after the last successful upload or question; reading or downloading does not extend it. The public version must also delete application data on that schedule. The initial public version accepts text PDFs of at most 10 pages and 10 MB per file, plus `.txt`, `.md`, and `.docx` files under the same size limit. Scanned PDFs receive a clear explanation until an OCR milestone is implemented.

## Capabilities and Constraints

- Spanish and English interface, initially Spanish, with an accessible switcher and persistent choice.
- Send the selected locale explicitly to any AI answer request; preserve direct source quotations in their original language.
- Use a server-held Groq API key for the public demo. The model choice remains subject to evaluation and provider availability.
- Keep the local application usable without a key. Do not label retrieval-only behavior as an AI answer.
- Separate the application's 24-hour retention from the provider's own data controls and disclose external processing before upload.
- Authenticate anonymous workspace access with an unguessable server-issued token. Authorize every document read, deletion, and query against that workspace.
- Public release requires upload limits, isolation, automatic cleanup, abuse controls, and measured citation support.

## Evidence on Hand

The project README and user decisions in this conversation. No application, demo, quality measurements, or public deployment existed when this product record was written.

## Product Principles

- Make source passages easy to inspect.
- Treat insufficient evidence as a normal outcome.
- Show the real status of ingestion and AI capabilities.
- Bound temporary public usage and delete application data on schedule.
- Keep implementation decisions and evaluation results explainable in interviews.
