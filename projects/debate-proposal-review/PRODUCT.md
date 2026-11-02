# Product

## Platform

Web application. The agreed local MVP uses a conversational homepage, Groq-backed review stages, local history, and human decisions. The task tracker records verification status.

## Users and purpose

Teams and individual reviewers who need to examine a product or operational proposal before a consequential human decision. The product makes assumptions, competing arguments, factual support, and open questions inspectable in one review.

## First demonstrable workflow

A reviewer starts a conversation on the homepage, explicitly consents to external AI processing, and supplies a proposal plus authorized text, TXT, MD, digital PDF, or DOCX sources. The assistant asks for missing context and produces an editable summary. The reviewer explicitly starts the analysis, then inspects competing arguments, factual evidence, and open questions on a separate review page. The reviewer records or corrects an approve, reject, or defer decision with rationale and optional conditions. Saved reviews remain on local disk until deleted from the history page. The original fictional example remains available as a labeled demonstration.

## Product principles

- Factual support and persuasive force are separate dimensions. A compelling argument can have insufficient evidence.
- The same source set is available to both perspectives. Counterarguments should address the strongest relevant concerns rather than fill a quota.
- Every source-based verdict has an inspectable passage and locator; missing evidence remains visible.
- A human owns the final decision and may disagree with the system's synthesis.
- The first pipeline stays bounded and inspectable. Add agents, longer memory, or durable jobs only when evaluation demonstrates a need.
- The interface starts in Spanish, supports English, and passes the selected locale explicitly to model requests. Direct source quotations stay in their original language.

## Boundaries

The example is fictional and cannot establish real business outcomes. The application runs independently of Document Intelligence and does not import its runtime code. Groq configuration is server-side; source text sent to it is external processing. Local storage has no accounts and retains extracted text and metadata, not uploaded original bytes. OCR, external search, collaborative access, production persistence, and public deployment are outside this MVP. A structural citation check is not proof of semantic support; evaluation reports must state their case counts and limits.
