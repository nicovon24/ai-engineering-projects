# Local MVP acceptance review

Reviewed on 2026-11-02. Requested independent reviewer: `gpt-6-sol`, high effort. Runtime-confirmed identity and effort: unconfirmed. The reviewer worked read-only and did not independently rerun every reported test.

## Findings and remediation

| Finding | Remediation | Verification |
| --- | --- | --- |
| Mixed evidence merged supporting and contradicting citations | Separate labeled citation groups in ES/EN | Targeted mocked browser regression and stable screenshots pass |
| Committed partial stage outputs hidden before evidence snapshot | Saved claims and perspective drafts appear with provisional labels | Targeted browser test failed before implementation and passes in ES/EN afterward |
| Lifecycle incorrectly associated Complete with human decision | Complete now means analysis ready; human save is separate | Nine diagram self-checks and rendered lifecycle inspection |
| Fixture-only continuity notes contradicted current implementation | README, requirements, AGENTS, tracker and CHECKLOG updated | Compared with current code and observed results |
| Foreign Host could match Origin and GET bypassed origin checks | All API methods now restrict authority to localhost or 127.0.0.1 and enforce same origin | Service regression failed with 200 instead of 403; after correction four service tests pass |

The initial concern that scripts exposed the server on all interfaces was withdrawn after inspecting package.json: both dev and start bind 127.0.0.1. The first mobile screenshot caught a navigation transition; a stable recapture confirmed the rail closes and the 390px viewport has no horizontal overflow.

## Model-quality boundary

See `evals/results-2026-11-02.md` for six-case bilingual evidence results and a qualitative sample of two completed reviews. Absolute guarantees, future extrapolation, and generated assertions omitted from the claim ledger remain observed weaknesses. Valid schemas and citation IDs do not establish semantic support. Human agreement was not measured.

## Verification evidence

- TDD red/green reports for contracts, transport, intake/storage, workflow, HTTP operations, chat updates, and local-origin handling.
- 37 Node behavior tests pass after the later chat clarification corrections. The independent reviewer evaluated the preceding 34-test integration; the three new regressions were verified by the coordinator.
- Playwright CLI browser-to-disk flow passed: consent, chat, file upload, simulated 429, retry, citation focus return, decision save/reload/correction, locale change, mobile layout, and deletion.
- Real Groq synthetic reviews completed in Spanish and English; runtime rate limits required runner retries.
- Final lint, typecheck and production build pass. The first sandboxed build compiled but failed spawning TypeScript with EPERM; the approved rerun completed.
- The complete browser-to-disk flow passed again after final UI and loopback authority fixes.

## Final disposition

The independent reviewer scored all five listed findings resolved and returned **ship** at local MVP scope, conditional on the final build and this status update; both are now complete. This scoped recheck does not establish general model reliability. A separate read-only design documenter confirmed that the extension preserves the incumbent visual direction; a factual extension note was added to DESIGN.md. No deployment or commit was made.
