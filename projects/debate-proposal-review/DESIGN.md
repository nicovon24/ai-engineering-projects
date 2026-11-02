---
name: Debate and Proposal Review
description: Warm, evidence-focused decision workspace
colors:
  light-ink: "#2d2824"
  light-muted: "#62574f"
  light-action: "#a64d2c"
  light-ground: "#f7f3ed"
  light-paper: "#fffdf9"
  light-rail: "#f1ebe3"
  light-border: "#e5dbd1"
  light-subtle: "#85786e"
  light-action-soft: "#f3e0d5"
  light-supported: "#3f7552"
  light-supported-soft: "#eaf2e9"
  light-contradicted: "#a64b40"
  light-contradicted-soft: "#f8e7e4"
  light-insufficient: "#9a681d"
  light-insufficient-soft: "#f7eddc"
  dark-ink: "#f4eee7"
  dark-muted: "#bbb5ae"
  dark-action: "#e69a72"
  dark-ground: "#1d1c1b"
  dark-paper: "#262522"
  dark-rail: "#171717"
  dark-border: "#403e3a"
  dark-supported: "#a4c9ad"
  dark-contradicted: "#d7a49c"
  dark-insufficient: "#e3be83"
typography:
  display: "Georgia, Times New Roman, serif"
  body: "Geist, ui-sans-serif, system-ui, sans-serif"
---

# Design system

**Creative north star: a quiet decision room.** The local prototype implements this direction in dark and light themes. It carries forward Document Intelligence's warm paper, restrained terracotta actions, readable dark mode, and inspectable evidence path. The visual roles are local to this project; it has no shared component or CSS dependency.

## Layout and hierarchy

The main reading column holds the proposal, competing arguments, claim ledger, and unresolved questions. A narrow left rail lists review stages and available sources. A source inspector opens only when a citation is selected, then shows the source name, locator, original excerpt, and evidence-verdict context. The human decision control is prominent after the evidence review, not before it. At mobile width, stages and sources become accessible panels while the review remains a single reading column.

The interface separates four things visually: the proposal's own claims, model-generated arguments, source evidence, and the human decision. Use explicit text labels rather than relying on color. Do not mirror pro and con cards merely for symmetry when their evidentiary weight differs.

## Type, color, and spacing

Use a restrained Georgia heading for the proposal title and Geist for 16 px review text with roughly 1.6 line height and a 720–800 px reading measure. Keep supporting text around 14 px. Use paper and rail surfaces to separate navigation from reading, with thin borders and little shadow. The dark palette should have distinct background, reading, and input surfaces.

Terracotta or soft peach marks the primary action and selected source. Neutral ink carries most text. Amber signals unresolved or weak evidence; supported and contradicted verdicts also include words and icons. Never use orange for every citation, heading, and secondary label at once. Provide visible keyboard focus, readable contrast, and at least 40–44 px primary touch targets.

## Core components

### Local MVP extension (2026-11-02)

The homepage centers conversational proposal intake, explicit consent, authorized sources and an editable summary. The navigation rail now links New review, Saved reviews and the fictional example; completed analysis opens on its own page. Vertical argument and claim sections preserve the reading measure. Saved partial outputs carry provisional labels, mixed verdicts separate supporting and contradicting citations, and a native passage dialog preserves original quotations and returns keyboard focus. A concise analysis advisory explains model fallibility and incomplete claim coverage. History and editable human decisions use the same local palette and typography. The older fixture keeps its own stage navigation at `/example`.

Independent documentation review inspected desktop and mobile captures and found the extension consistent with the incumbent direction. Existing documentation drift remains: the dark-muted frontmatter token differs from the CSS muted value; alpha-black overlay shades are intentional implementation details but are not listed as palette tokens. This extension does not redefine the visual system.

- **Review stepper:** intake, claims, perspectives, evidence, open questions, human decision. Show progress without implying that an automated verdict is final.
- **Argument row:** perspective, concise reason, linked claim IDs, and a separate evidence state.
- **Claim ledger row:** atomic claim, source-backed verdict, cited passage references, and an expandable rationale.
- **Source inspector:** compact numbered citation opens the original-language passage and locator; closing returns focus to the citation.
- **Decision form:** approve, reject, or defer, with required reviewer rationale and optional conditions. Model text is advisory and never preselects an outcome.
- **Status and disclosure:** brief labels for supported, contradicted, mixed, and insufficient; expanded text explains the evidence limit.

## Verification required when implemented

The first Playwright pass checked Spanish and English, desktop and 390 px mobile widths, citation opening, Escape and focus return, and local decision confirmation. Lint, TypeScript, and production build passed. A later pass should check the full light theme, long generated claims, missing/contradictory source failure states, and contrast before a wider release.
