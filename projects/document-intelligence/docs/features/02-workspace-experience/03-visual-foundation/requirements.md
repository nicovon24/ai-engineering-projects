# Visual foundation

Status: Implemented for the local Document Intelligence prototype; visual verification is recorded in [review.md](review.md).

## Goal

Make the existing workspace easier to read and operate at desktop and mobile sizes. Establish a reusable warm visual foundation for future independent projects without coupling their code to this application.

## Scope

- Keep the existing document, conversation, and source layout and both persistent themes.
- Use a restrained terracotta orange for primary actions, focus, citations, and selected details, with warm neutral surfaces.
- Increase the scale of inputs, buttons, labels, answer text, source text, and supporting copy.
- Keep the composer visible within the viewport and retain internal scrolling for documents, history, and sources.
- Document the implemented tokens and portable guidance for later projects.

## Acceptance

- **REQ-VIS-001:** Light and dark themes use warm surfaces and a consistent orange action/focus accent with readable text and control contrast.
- **REQ-VIS-002:** The question input and principal controls are comfortably sized for desktop and touch use, while supporting text remains legible.
- **REQ-VIS-003:** The workspace has no horizontal overflow at 320 px, 390 px, 1024 px, or 1440 px; the composer stays accessible within a 100dvh shell.
- **REQ-VIS-004:** Upload, locale, theme, mobile panels, question entry, and source inspection remain operable; keyboard focus is visible.
- **REQ-VIS-005:** `DESIGN.md` and `.impeccable/design.json` describe the actual Document Intelligence tokens, and a repository-level guide explains how future independent projects can reuse the visual direction.

## Boundaries

This work does not claim semantic answer quality, production readiness, or a live-provider verification. The orange direction is inspired by the requested warmth; no external brand assets or code are reused.
