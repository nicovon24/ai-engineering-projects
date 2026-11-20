# Repository Investigation Agent product outline

**Status: In progress.** The current application is a local prototype under construction. OpenSpec describes the intended MVP; only verified code and CHECKLOG entries describe implemented behavior.

## Purpose

Let a local user investigate a public GitHub repository, see the files and commit behind an answer, and resume the conversation later without losing prior questions, answers, or inspected paths.

## MVP contract

- A repository URL and question start a bounded, read-only investigation.
- A source-backed answer cites exact file lines at an immutable commit; unsupported questions return insufficient evidence.
- A compact trace shows what the agent inspected and why it stopped.
- All conversation messages and relevant investigation records persist locally across sessions and conversations for the same repository.
- Every new question checks the current commit. Changed source is rechecked; historical answers keep original citations.
- The interface starts in Spanish and supports a persistent English choice.

## Limits

The first version is local and single-user. It accepts public GitHub repositories only, has fixed read budgets, and does not clone or execute repository code. A fixture demonstration works without model credentials; open-ended live answers use Groq when `GROQ_API_KEY` is configured. It does not sync data across devices or maintain a separate user-profile memory.
