# Workspace UI V2

Status: Complete for the local prototype. Public readiness is outside this acceptance.

## Goal and route

Redesign the existing Document Intelligence workspace as a focused document conversation interface. This is an SDD delegated change because the interactive layout, theme persistence, and reusable controls span multiple UI files. The user-provided Claude screenshot is a layout and atmosphere reference, not a source of branding, code, copy, or assets.

## Scope

- Preserve the existing upload, delete, question, citation, download, locale, and error behavior.
- Use a distinct Document Intelligence identity with a document rail, conversation canvas, and inspectable source area.
- Add user-selectable light and dark themes, persistent across reloads, with an accessible control.
- Use shadcn/ui components or generated component primitives for repeated controls. Keep the application independently runnable.
- Keep the first screen honest about empty documents and the difference between evidence search and Groq answers.

## Acceptance

- **REQ-UI-001:** At desktop size, the user can find documents, questions, and source passages in distinct regions; the empty state makes upload and questioning order clear.
- **REQ-UI-002:** At narrow mobile width, all active controls remain usable without horizontal overflow and source inspection remains available.
- **REQ-UI-003:** The user can switch between light and dark themes, the selection survives reload, and the initial render avoids a wrong-theme flash.
- **REQ-UI-004:** Spanish remains the initial locale; switching to English persists and all new user-visible labels are translated.
- **REQ-UI-005:** Existing upload, remove, workspace delete, question submission, citation selection, and source download wiring remains intact.
- **REQ-UI-006:** Reusable Button, Textarea, and related interface primitives follow the shadcn/ui local-component pattern and exist as local source files, with no runtime dependency on a component registry. Git commits are outside this UI acceptance; the current working tree remains uncommitted.
- **REQ-UI-007:** The interface does not claim unsupported upload, retrieval, citation quality, or production readiness.

## Evidence and next step

Baseline: existing `src/app/workspace.tsx`, `src/app/globals.css`, `src/lib/i18n.ts`, and running local Next.js prototype. Implementation and acceptance evidence are in [design.md](design.md) and [review.md](review.md). The next active task is DI-005: expand the narrow evaluation corpus beyond synthetic passages and files.
