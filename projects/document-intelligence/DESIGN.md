---
name: Document Intelligence
description: Warm, evidence-focused document workspace
colors:
  light-ink: "#2d2824"
  light-muted: "#62574f"
  light-action: "#a64d2c"
  light-action-soft: "#f7e9df"
  light-ground: "#f7f3ed"
  light-paper: "#fffdf9"
  light-rail: "#f1ebe3"
  light-border: "#e5dbd1"
  dark-ink: "#f4eee7"
  dark-muted: "#c5b7aa"
  dark-action: "#e69a72"
  dark-action-soft: "#433026"
  dark-ground: "#1b1917"
  dark-paper: "#24211e"
  dark-rail: "#191715"
  dark-border: "#423a33"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 2.9vw, 2.7rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
  supporting:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
rounded:
  control: "10px"
  composer: "16px"
spacing:
  tight: "8px"
  control: "12px"
  base: "16px"
  group: "24px"
  region: "32px"
components:
  button-primary:
    backgroundColor: "{colors.light-action}"
    textColor: "{colors.light-paper}"
    rounded: "{rounded.control}"
    height: "44px"
  composer:
    backgroundColor: "{colors.light-paper}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.composer}"
---

# Design System: Document Intelligence

## Overview

**Creative North Star: "A quiet reading desk."** The interface gives documents, conversation, and exact source passages clear places. Warm paper and brown ink make prolonged reading comfortable; orange identifies the next action and the evidence path. The UI stays compact enough for a viewport-bound workspace without shrinking important text.

**Key Characteristics:** warm neutral surfaces, restrained terracotta actions, generous readable inputs, and explicit source inspection.

## Colors

The CSS semantic roles in `src/app/globals.css` are the implementation source of truth. Light mode uses `light-ground`, `light-paper`, and `light-rail` as distinct surfaces. Dark mode uses the corresponding dark tokens rather than a direct inversion. Orange action tokens map to `--primary`, `--accent`, and `--focus` with theme-specific foregrounds. Muted text is still strong enough for reading. Warning and error retain separate semantic colors and text cues.

Primary orange is reserved for submit actions, citations, focus, and small status details. Large reading surfaces remain neutral.

## Typography

The one prominent introduction heading uses Georgia. Geist is used for controls, chat, document names, and passages. Body and answer text are approximately 16 px; supporting copy is approximately 14 px. The document and chat widths keep long reading lines bounded, and headings use balanced wrapping.

## Layout

At wide sizes, the viewport-bound workspace has a document rail, flexible conversation, and source panel. At 1100 px, sources open in an overlay; at 700 px, documents and sources use dedicated mobile panels. The conversation keeps its composer visible while history scrolls inside its own region. Documents and source passages also scroll independently. Spacing follows a 4 px rhythm, with tighter control groups and larger separations between regions.

## Elevation & Depth

Panels use tonal surfaces and thin separators. The composer alone has a soft offset shadow (`0 10px 30px rgba(30, 18, 10, .09)`) to stay distinct from the history above it.

## Shapes

Controls use softly rounded corners near 10 px; the composer uses 16 px. Pills are limited to small status indicators. File and source placeholders use simple document geometry without decorative illustrations.

## Components

### Buttons

Primary buttons are 44 px high with theme-aware orange and a contrasting foreground. Smaller toolbar controls remain at least 40 px high. Hover changes color; keyboard focus uses the visible `--focus` outline.

### Inputs

The question field uses 16 px text and an 88 px minimum content area inside the composer. The file picker uses a full-width, dashed outline and a separate submit action. Both retain visible labels and focus states.

### Evidence

Question bubbles use a soft neutral surface. Citations use pale orange, a border, and the orange text role; source passage text remains on a neutral reading surface. Status also has words, so its meaning does not depend on color.

## Do's and Don'ts

- **Do** use semantic tokens and verify both themes whenever adding a component.
- **Do** preserve readable 16 px body text and large touch targets in task flows.
- **Do** keep history and passages inside their owning scroll regions.
- **Don't** fill large surfaces with orange or use it for unrelated decoration.
- **Don't** introduce a shared runtime dependency between projects to reuse this visual direction.
