# Debate and Proposal Review task status

This is the canonical task tracker. Compare it with CHECKLOG.md, README.md, the feature requirements, current code, and Git state before acting. The local MVP is implemented; its acceptance review and measured limitations are tracked below.

| ID | Requirement | Work | Status | Evidence / remaining work |
| --- | --- | --- | --- | --- |
| DPR-001 | REQ-001 | Original fictional proposal and permitted sources | Complete | Locally authored fixture and `/example`; no real pilot claim. |
| DPR-002 | REQ-002–005, 008 | Claim ledger and evidence contracts | Complete | Typed review contract, origin/argument links and review-owned citation validation; behavior tests. |
| DPR-003 | REQ-001, 003–004, 007–008 | Inspectable bilingual fixture | Complete | `/example`, passage inspector, theme/locale controls and fixture validation. |
| DPR-004 | REQ-002, 004–006, 008 | Staged generation and durable human decision | Complete | See DPR-008–010; actual bilingual synthetic workflows completed. |
| DPR-005 | REQ-009 | Evaluate factual support and review quality | Checkpoint complete; broader evaluation open | Six fixed cases per locale: ES 5/6, EN 4/6. Two full reviews sampled for opposing arguments/open questions. No human inter-reviewer agreement measurement or general quality claim. |
| DPR-006 | REQ-003, 004, 008 | Contract validation with TDD | Complete | Six contract tests, including mixed evidence, foreign citations and reciprocal claim links. |
| DPR-007 | REQ-011, 012 | Digital intake and local storage | Complete | Synthetic PDF/DOCX, scanned-PDF rejection, atomic updates, concurrency and deletion tests. |
| DPR-008 | REQ-002, 005, 010, 013 | Groq transport, chat and staged workflow | Complete | Strict provider schemas where supported, domain validation, bounded context, successful synthetic ES/EN live runs. Semantic errors remain documented. |
| DPR-009 | REQ-006, 008, 010–013 | HTTP operations and consent | Complete | Four service tests; local-origin regression red/green; browser-to-disk integration passed. |
| DPR-010 | REQ-007, 010, 012 | Chat homepage, history and review detail | Complete | Chat update/locale/new-review regressions passed. Separate mixed-citation groups and provisional committed outputs verified in ES/EN. |
| DPR-011 | Architecture | System diagrams | Complete | Four standalone SVGs with simple names: overview, review, evidence, and privacy. The overview traces the implemented flow through a human decision and history; focused views show stages, evidence, and consent. XML, security lint, and browser rendering verified. |
| DPR-012 | REQ-009 | Independent review and final handoff | Complete | Sol high requested, runtime unconfirmed. Five findings resolved; scoped ship disposition and final browser-to-disk flow passed. |
| DPR-013 | REQ-010 | Stop repeated clarification questions | Complete | User reported repeated multi-question replies after explicitly requesting no more questions. Two TDD regressions failed, then passed; 36 total tests, lint, typecheck and production build pass. |
| DPR-014 | REQ-010, architecture | Recognize open-question handoff and deliver SVG diagrams | Complete | The user's exact phrase failed the intake closure regression, then passed. Initial nine SVG variants parsed and rendered; the later diagram audit retained three canonical SVGs. 37 tests, lint, typecheck and production build passed at this checkpoint. |
| DPR-015 | REQ-DPR-008, 013–014 | Diagnose provider limit and complete source-free reviews | Complete | Live synthetic 20b/120b probes returned 200; 429 is a rate-limit response, not a dead key. New ES/EN TDD regressions failed before the source-free workflow fix and pass after. The saved evidence-stage review advanced through HTTP to Complete; Playwright confirmed the open question, no selected decision, and no provider error. 39 tests, lint, typecheck, build pass; independent Sol-high review found no blocker (runtime identity unconfirmed). |
| DPR-016 | Architecture | Show the consent and data boundary | Complete | Fourth SVG generated from implemented chat, intake, provider, and local storage paths. Missing-file check failed before generation and passed after; XML, security lint, and browser rendering checked. |

Requirement IDs in this table abbreviate the `REQ-DPR-` prefix. Detailed observed results are in `evals/results-2026-11-02.md`. New implementation follows TDD. Test doubles prove application behavior, not semantic correctness. No deployment or push is part of this work.

Next: use the local MVP and expand evaluation before quality claims. Future evaluation work includes larger bilingual samples, claim coverage, counterargument/open-question recall, and human agreement.
