# Repository Investigation Agent checklog

**Status:** Local MVP complete. OpenSpec records 20 of 20 implementation tasks complete. No deployment or broad answer-quality evaluation exists.

## Current direction

- Local, single-user investigator for public GitHub repositories.
- Preserve questions, answers, discussion, and inspected evidence across conversations about the same repository.
- Check the current commit before every new question and recheck relevant source when it changed. Historical answers keep their original commit citations.
- The active OpenSpec change is [repository-investigation-mvp](openspec/changes/repository-investigation-mvp/proposal.md). The application supports a keyless fixture and Groq-backed public-repository investigations; live provider answer quality remains unverified.

## Recent changes

- 2026-11-20: Independent read-only review compared both capability specs and the design with the source, routes, persistence, UI, and tests. Three findings on refresh history, cross-conversation historical labeling, and text-search coverage were fixed; a follow-up regression in the status label was fixed and re-reviewed. No findings remain in that focused review. Requested reviewer model/effort: `gpt-6-sol` high; runtime-confirmed model/effort: unconfirmed.
- 2026-11-20: Verified 23 focused tests, typecheck, lint, and build. Browser checks covered Spanish and English fixture answers, commit-linked citations, persisted English choice, cross-conversation search and navigation, conversation deletion, a narrow viewport, and a mocked refresh-failure historical panel. Added mocked provider-locale and localized source-failure checks and prior inspected-path recall without citations.
- 2026-11-20: Switched live answer generation to the workspace's Groq chat-completions configuration and copied the existing local Groq settings into this project's ignored `.env.local`. Updated the example, instructions, requirement, and implementation task. Live answer quality remains unevaluated.
- 2026-11-20: The live GitHub check initially returned `rate_limited`, then succeeded for `octocat/Hello-World` at `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`. A reproducible integration script read its README, reused same-commit evidence on a repeated question, simulated a changed commit, and verified three persisted runs and unchanged historical citation.
- 2026-11-20: Initialized project-local OpenSpec and drafted the MVP proposal, capability specs, design, and implementation tasks. An independent review led to explicit coverage of discussion history, inspected paths, commit refresh, and citation-safe deletion.

## Next technical handoff

Run the final checks after any further code change. Sync and archive the completed OpenSpec change after verification and acceptance. For future work, evaluate real provider-backed answers and answer quality separately from the completed local MVP.
