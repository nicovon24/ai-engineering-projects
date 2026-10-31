# Document question answering review record

## Earlier code review

- Reviewer creation was observed through `collaboration.spawn_agent`; the runtime returned task name `/root/document_intelligence_review`. Its message and `FINAL_ANSWER` were received. A separate session ID was not exposed.
- Requested model and effort: `gpt-6-sol`, high. Effective model and effort confirmed by runtime: **unconfirmed**.
- Scope examined: the local upload, question, Groq, citation, retention, and deletion flow before the later concurrency edits.
- Findings: a question could save citations after document removal; parallel questions could consume Groq before quota enforcement; retention wording implied reads extended access. The reviewer did not edit code or run tests.
- Subsequent code and documentation changes addressed the findings, so that earlier review is **superseded** and does not approve the current implementation.

## Earlier implementation handoff

- Worker creation was observed through `collaboration.spawn_agent`; the runtime returned task name `/root/document_intelligence_concurrency`. Its message and `FINAL_ANSWER` were received. A separate session ID was not exposed.
- Requested model and effort: `gpt-6-sol`, medium. Effective model and effort confirmed by runtime: **unconfirmed**.
- Assigned files were `src/lib/storage.ts`, `src/lib/types.ts`, `src/app/api/questions/route.ts`, and `src/lib/i18n.ts`. The worker reported atomic reservations, stale-source rejection, localized errors, and successful lint, typecheck, and build. The coordinator subsequently inspected those files, updated public workspace projection and documentation, and ran lint, typecheck, and build again with exit 0.
- This handoff is implementation evidence, not an independent approval of the post-edit code.

## Current review status

An independent review of the full current code against REQ-001 through REQ-008 has not yet been recorded. The focused DI-004 review below covers its local storage contract only. Lint, typecheck, build, and one synthetic TXT browser flow are evidence of narrower behavior. A future full-scope reviewer should examine the exact code revision and acceptance, report findings by requirement, and record requested versus runtime-confirmed model separately.

## DI-004 local storage review, 2026-10-31

- Implementer creation and follow-up were observed through `collaboration.spawn_agent` and `collaboration.followup_task` for `/root/di004_verification`; messages and final delivery were received. Requested model and effort: `gpt-6-sol`, medium. Runtime-confirmed model and effort: **unconfirmed**.
- Reviewer creation and follow-up were observed through `collaboration.spawn_agent` and `collaboration.followup_task` for `/root/di004_review`; messages and final verdict were received. Requested model and effort: `gpt-6-sol`, high. Runtime-confirmed model and effort: **unconfirmed**; the runtime did not expose a separate session ID.
- The initial review found that `addQuestion` accepted a reservation older than two minutes unless another reservation had pruned it, and that manual deletion verification checked metadata rather than the original file path. The implementer corrected `src/lib/storage.ts` and the focused verifier. The reviewer then re-examined the updated code and reported **no blocker for REQ-006/REQ-007 in the local prototype**.
- The implementer reported `node evals/storage-verification.mjs` at 19/19 checks, focused ESLint, typecheck, and build with exit 0. The coordinator additionally observed full `npm run lint` and `npm run typecheck` with exit 0 after the fix. These checks exercise storage in one process with synthetic data; HTTP cookie behavior, provider failure, cross-instance limits, and real elapsed 24-hour retention are not proven.
- The reviewer noted that file-absence checks accept any read error rather than specifically `ENOENT`. This is a minor test precision limitation; code inspection shows recursive removal of the workspace directory.

## DI-005 synthetic parsed-document review, 2026-10-31

- Implementer creation and delivery were observed through `collaboration.spawn_agent` and final return for `/root/di005_parsed_eval`. Requested model and effort: `gpt-6-sol`, medium; runtime-confirmed model and effort: **unconfirmed**.
- Independent reviewer creation and re-review were observed through `collaboration.spawn_agent` and `collaboration.followup_task` for `/root/di005_review`. Requested model and effort: `gpt-6-sol`, high; runtime-confirmed model and effort: **unconfirmed**. No separate session ID was exposed.
- The reviewer ran `node evals/run-parsed-retrieval.mjs --json` with exit 0 and reproduced two parsed synthetic files, two passages, eight cases, macro recall@5 and annotated precision both 0.67, and empty results 2/2. An initial low-severity median calculation finding was corrected and the reviewer rechecked the conventional median. The narrow synthetic checkpoint has **no remaining blocker**.
- REQ-008 and DI-005 remain **in progress**. The cases do not cover a scanned PDF in this runner, representative real documents, model answers, semantic support, refusal, full latency, or cost. The existing DI-002 format review covered a textless PDF rejection separately.

## DI-003 answer-contract review, 2026-10-31

- Implementer creation, follow-up, and final delivery were observed through `collaboration.spawn_agent` and `collaboration.followup_task` for `/root/di003_answer_contract`. Requested model and effort: `gpt-6-sol`, medium; runtime-confirmed model and effort: **unconfirmed**.
- Independent reviewer creation, follow-up, and final verdict were observed through the same runtime tools for `/root/di003_review`. Requested model and effort: `gpt-6-sol`, high; runtime-confirmed model and effort: **unconfirmed**. No separate reviewer session ID was exposed.
- The first review found that whitespace-only claim text could pass Zod validation as an `answered` result. The implementer added trim and nonblank validation plus mocked cases. The reviewer ran the updated `node evals/answer-contract-verification.mjs` and observed **19/19 checks, exit 0**, with no blocker in the narrow answer-contract scope.
- The implementer reported lint, typecheck, and build with exit 0 after the fix; the coordinator also reran the focused answer verifier and observed 19/19. The runner uses synthetic passages, a synthetic key, and mocked `fetch`. It does not establish actual Groq behavior, semantic support, browser/HTTP integration, full latency, or cost. Citation IDs establish retrieved-passage membership only.

## DI-005 private-runner review, 2026-10-31

- The implementer `/root/di005_private_runner` was requested as `gpt-6-sol`, medium, with ownership of the local evaluation runner and guide. The reviewer `/root/di005_private_runner_review` was requested as `gpt-6-sol`, high, for a read-only independent review. Runtime-confirmed model and effort for both: **unconfirmed**. Neither agent was given access to the private user document or its labels.
- The first review found that raw input case IDs and version could appear in output and that BOM-prefixed JSON was rejected. The implementer replaced raw IDs with ordinal case references, removed the version from output, and accepted a UTF-8 BOM. The reviewer rechecked these privacy behaviors with synthetic input.
- A further synthetic overlap case exposed ambiguous evidence labels. The implementer added optional zero-based `passageIndex`; the reviewer verified correct selection, safe mismatch errors, and continued behavior of the original synthetic PDF fixture. The reviewer reported **no blocker for private local use in the runner's scope**.
- The coordinator then ran the reviewed runner against one user-provided two-page text PDF and eight private cases without Groq. [Anonymous results](../../evals/private-document-baseline.md) show recall@5 0.83, annotated precision 0.32, and empty retrieval 2/2. The PDF, local case file, and source text remain ignored or outside the repository. This does not approve answer quality, semantic support, or broad parser compatibility.
