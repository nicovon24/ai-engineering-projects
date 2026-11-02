# Debate and Proposal Review CHECKLOG

This is a manual continuity note. The canonical task tracker is `docs/specs/tasks.md`.

## Resume protocol

Compare this note with Git state, current code, README.md, active feature requirements, and the task tracker before acting. Do not infer completion from a generated artifact alone.

## Current state

An independent local Next.js MVP opens chat at `/`, saved reviews at `/reviews`, generated analysis and editable decisions at `/reviews/[id]`, and the hand-authored fixture at `/example`. Server-side Groq calls clarify the proposal and execute a bounded persisted workflow. Own digital sources and decisions are stored locally. A source-free review can finish Evidence and Synthesis without another provider call. The latest 39 behavior tests, lint, typecheck, production build, and saved-review HTTP/browser verification pass. An independent Sol-high review found no blocker in the source-free change; runtime identity is unconfirmed. Model-generated argument quality remains limited by the recorded evaluation findings.

## Decisions

- Spanish initially; persistent English choice; every model request carries its locale.
- Explicit consent before external AI processing, editable summary, explicit Generate action.
- TXT/MD/digital PDF/DOCX or pasted text; retain extracted text and metadata until review deletion. No OCR.
- Local atomic JSON records, single process, no accounts; dev/start bind loopback.
- Human approve/reject/defer with rationale, conditions and correction timestamp; no model-selected outcome.
- TDD for new implementation in this project. Document Intelligence remains an independent project.
- Coordination requested Astra medium; implementation Sol medium; research Luna high; independent review Sol high. Effective runtime identities are unconfirmed.

## Recent changes

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-11-02 | Renamed the four SVGs to overview, review, evidence, and privacy; replaced the architecture view with a whole-system flow. | Generator, XML/security lint, browser render, and local link check. |
| 2026-11-02 | Added a consent and data-flow SVG showing local intake and storage, bounded text sent after consent, and provider output returning to the local service. | DPR-016; diagram generator, XML/security lint, and browser inspection. |
| 2026-11-02 | Reviewed system diagrams against the implemented local MVP and kept three distinct views: architecture, lifecycle, and evidence. Removed six duplicate visual variants and corrected the source-free lifecycle. | Generator creates three standalone SVGs; diagram lint and browser inspection show the current boundaries and separate human decision. |
| 2026-11-02 | Diagnosed a real source-free review blocked by Groq 429 at synthesis; added deterministic source-free Evidence and Synthesis completion and a safe provider probe. | Saved review had zero sources and 21 factual insufficient verdicts. 20b and 120b synthetic calls returned 200. Two bilingual TDD regressions failed before the fix; 39 tests, lint, typecheck, build pass. The same saved review advanced to Complete through HTTP; Playwright confirmed no error or selected decision. Independent Sol-high review found no blocker, effective identity unconfirmed. |
| 2026-11-02 | Converted system diagrams to standalone SVG and made SVG the project rule; extended intake closure to recognize the user's open-question handoff. | The original nine SVG variants parsed and rendered; the later audit retained three canonical diagrams. One TDD regression failed before the chat fix and passed after. 37 tests, lint, typecheck and build passed at this checkpoint. |
| 2026-11-02 | Corrected repeated clarification questions after the reviewer asks to proceed. | Two new workflow regressions failed before the fix and pass afterward; 36 tests, lint, typecheck and production build pass. |
| 2026-11-02 | Integrated local chat, source intake, staged review, history, retry and persistent decisions. | Behavior tests and Playwright browser-to-disk flow; independent review findings tracked canonically. |
| 2026-11-02 | Ran actual Groq synthetic workflows in ES/EN and six fixed evidence cases per locale. | `evals/results-2026-11-02.md`: ES 5/6, EN 4/6 label agreement; semantic errors and omitted prose claims documented. |
| 2026-11-02 | Created architecture, lifecycle and evidence diagrams. | `system-design/`; originally HTML with visual variants, later converted to SVG and reduced to three canonical files. |
| 2026-11-02 | Built the bilingual fixture prototype and original requirements. | `/example`, feature documents, and fictional source set. |

## Next handoff

The saved source-free review now completes without a provider retry. Its generated arguments include unsupported assertions and must be treated as hypotheses. Follow docs/features/01-proposal-review/review.md for prior validation evidence and evals/results-2026-11-02.md for observed model limits. Broader model-quality evaluation and human agreement remain future work; do not describe the observed synthetic checkpoint as general accuracy or production readiness.
