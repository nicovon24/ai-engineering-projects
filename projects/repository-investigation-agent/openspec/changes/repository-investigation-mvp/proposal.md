# Proposal

## Why

Investigating a repository across several conversations currently requires repeating questions and re-reading code without a reliable record of what was examined. A local agent should preserve that context while checking the repository's current commit before reusing earlier findings.

## What Changes

- Create an independent, local, bilingual application for read-only investigation of public GitHub repositories.
- Accept a repository URL and a question; use bounded tree, search, and file-read tools to produce an answer with file and commit citations, a compact investigation trace, or an explicit insufficient-evidence result.
- Persist conversations, questions, answers, cited files, and investigation records locally. Make earlier conversations for the same repository searchable and available as context for new questions.
- On each new question, resolve the current default-branch commit. When it differs from a prior investigation, recheck relevant source before carrying its findings forward; keep historical answers linked to their original commit.
- Allow the local user to inspect and delete saved conversations and their investigation records.

## Capabilities

### New Capabilities

- `repository-investigation`: Bounded, source-linked investigation of a public GitHub repository at an immutable commit.
- `conversation-continuity`: Local cross-conversation history and investigation reuse with commit-aware freshness and user control.

### Modified Capabilities

None. This project has no existing capability specs.

## Impact

New project-local application, OpenSpec artifacts, local persistence, and documented run commands under `projects/repository-investigation-agent/`. The application uses public GitHub read APIs and an optional model provider for open-ended answers; a keyless local fixture demonstrates the complete contract. It does not depend on another project, accept private repositories or uploads, modify source repositories, or sync history across devices.
