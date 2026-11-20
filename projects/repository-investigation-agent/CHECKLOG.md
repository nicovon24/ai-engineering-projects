# Repository Investigation Agent checklog

**Status:** Local MVP complete. OpenSpec records 20 of 20 implementation tasks complete. No deployment or broad answer-quality evaluation exists.

## Current direction

- Local, single-user investigator for public GitHub repositories.
- Preserve questions, answers, discussion, and inspected evidence across conversations about the same repository.
- Check the current commit before every new question and recheck relevant source when it changed. Historical answers keep their original commit citations.
- The active OpenSpec change is [repository-investigation-mvp](openspec/changes/repository-investigation-mvp/proposal.md). The application supports a keyless fixture and Groq-backed public-repository investigations; live provider answer quality remains unverified.

## Recent changes

- 2026-11-20: Diagnosed repeated Groq HTTP 400 `tool_use_failed` after README reads. A direct request to configured `openai/gpt-oss-120b` accepted strict JSON schema decisions; the planner now uses that protocol for bounded operations and still validates decisions server-side. Complete live `nicovon24/fintrack` questions at `8d2592e9b1` returned English and Spanish answers with 11 and 12 verified citations. Browser inspection confirmed answer, source links, and trace. Verified 27 focused tests, typecheck, and lint.
- 2026-11-20: Added optional authenticated public GitHub reads. Browser verification confirmed the token resolves `nicovon24/hermes` at `e1e657a023` and reads 92 README lines. The live answer is still blocked by Groq HTTP 429 after fixing oversized planner context and accepting Groq's bare declared function names. Verified 26 focused tests, typecheck, and lint.
- 2026-11-20: Added optional server-side `GITHUB_TOKEN`/`GH_TOKEN` authentication for public GitHub API reads after the live flow hit the shared unauthenticated rate limit. The local GitHub CLI is present but not authenticated, so a live authenticated answer still requires a token in ignored `.env.local`.

- 2026-11-20: Independent read-only review compared both capability specs and the design with the source, routes, persistence, UI, and tests. Three findings on refresh history, cross-conversation historical labeling, and text-search coverage were fixed; a follow-up regression in the status label was fixed and re-reviewed. No findings remain in that focused review. Requested reviewer model/effort: `gpt-6-sol` high; runtime-confirmed model/effort: unconfirmed.
- 2026-11-20: Verified 23 focused tests, typecheck, lint, and build. Browser checks covered Spanish and English fixture answers, commit-linked citations, persisted English choice, cross-conversation search and navigation, conversation deletion, a narrow viewport, and a mocked refresh-failure historical panel. Added mocked provider-locale and localized source-failure checks and prior inspected-path recall without citations.
- 2026-11-20: Integrated the workspace's Groq chat-completions configuration and copied its existing local settings into this project's ignored `.env.local`. A live request showed GPT-OSS emitted a native search function while the planner expected JSON, causing HTTP 400; declared Groq functions and server-side validation now match the model protocol. The app accepted the live function call, then GitHub rate-limited the source read before an answer could be completed.
- 2026-11-20: The live GitHub check initially returned `rate_limited`, then succeeded for `octocat/Hello-World` at `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`. A reproducible integration script read its README, reused same-commit evidence on a repeated question, simulated a changed commit, and verified three persisted runs and unchanged historical citation.
- 2026-11-20: Initialized project-local OpenSpec and drafted the MVP proposal, capability specs, design, and implementation tasks. An independent review led to explicit coverage of discussion history, inspected paths, commit refresh, and citation-safe deletion.

## Next technical handoff

Evaluate answer quality across more repositories and configured models. Sync and archive the completed OpenSpec change after verification and acceptance.
