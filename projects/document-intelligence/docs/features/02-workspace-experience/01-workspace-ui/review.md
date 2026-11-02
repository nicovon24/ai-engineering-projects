# Workspace UI V2 review

Date: 2026-10-31. UI-001 acceptance: [requirements.md](requirements.md), REQ-UI-001–007. Final code: current local working tree; files are uncommitted.

## Delegation and handoff

The coordinator created `/root/workspace_ui_v2` through `collaboration.spawn_agent` with exclusive UI/config ownership, requesting `gpt-6-sol` medium. The agent returned a handoff and final answer: official shadcn CLI initialization, local Button/Textarea components, responsive conversation layout, theme persistence, and passing lint/typecheck/build. A follow-up cleanup in the same agent reduced old CSS and improved selected-file feedback. The runtime did not confirm the effective model or effort.

The coordinator then corrected the localized visible file picker, a stale-language transient message, 320 px header overflow, and the accessible theme state. These corrections were observed in Playwright CLI and passed lint/typecheck/build. The `impeccable` detector returned an empty finding list after the final UI edits.

## Browser evidence

- Desktop at 1280 px and mobile at 390 px were inspected in light and dark themes. At 390 px, `scrollWidth` equaled the viewport width. At 320 px, an overflow of 335 px was reproduced, then corrected to 320 px with `scrollX` 0.
- Locale changed to English and remained English after reload; the selected theme remained light after reload. The theme button changed `aria-pressed` from true to false when toggled, and settled to false after hydration in light mode.
- Mobile document and source controls opened their respective regions. The file picker showed translated labels, displayed the selected filename, cleared it after upload, and gave a localized error for an empty submission.
- A synthetic 10-page PDF and TXT in a temporary workspace produced one English Groq answer with a page-1 citation; selecting it opened the matching source passage. The authorized PDF download returned HTTP 200 with `application/pdf`. The synthetic workspace was manually deleted after the review.
- Final captures are under `.impeccable/review/` and are ignored by Git.

## Independent review

The coordinator created `/root/workspace_ui_v2_review` with `collaboration.spawn_agent`, requesting `gpt-6-sol` high, read-only and fresh context. The reviewer returned four findings: the wording of a self-imposed commit requirement, possible 320 px overflow, missing accessible theme state, and stale CHECKLOG. The coordinator corrected each, then used `collaboration.followup_task`. The same independent reviewer returned a second message and final answer finding no remaining UI-001 blockers. The effective reviewer model and effort were not confirmed by the runtime.

## Checks and limits

`npm run lint`, `npm run typecheck`, and `npm run build` each exited 0 after the last UI code edits. No automated application tests were added. UI-001 is complete for the local prototype. Broad parser compatibility, semantic claim support, scheduled deletion, abuse controls, and public readiness are separate work.

## UI-002 viewport and chat review (2026-11-01)

- The shell now occupies `100dvh`; the document rail, history, and source region scroll internally. The introduction disappears after the first saved question, leaving more room for the chat. Questions render in stored append order, and a change to the latest question ID scrolls the history to its end.
- Playwright CLI observed no document-level vertical or horizontal overflow at 1280×720, 1024×768, 390×844, and 320×568. At 640×360, the history retained a 90 px scroll region and the conversation itself remained scrollable. A 1000-character unbroken question and passage stayed within the 320 px viewport.
- A temporary synthetic TXT and two locally injected UI records showed oldest-to-newest order and bottom positioning (`scrollTop` 479, `scrollHeight` 642, `clientHeight` 163 at 320×568). The history stayed at the manually chosen top position after a theme change. Mobile document and source panels filled only the available height; closing each restored focus to its opener. At 1024 px, the source panel opened within the viewport. The synthetic workspace and files were deleted after review.
- A read-only independent reviewer requested `gpt-6-sol` high and identified focus restoration and long-word clipping; both were corrected. The runtime did not expose its confirmed model or effort. The final Impeccable detector returned `[]`; lint and typecheck exited 0. No automated test was added.
- Automatic approval review rejected a live Groq question because it could send a query and file passages to an external provider without specific authorization. The two chat records were inserted locally for interface verification; this review does not establish live question submission or model behavior after the UI change.
