# Workspace UI V2 design

## Direction

The user supplied a dark conversation interface as a visual reference. Document Intelligence uses its own document icon, copy, green-neutral palette, and source-focused product structure. The layout has a document rail, a conversation canvas with a composer, and an inspectable source region. Mobile reveals documents and sources through explicit controls rather than compressing three columns.

The visual direction is a quiet reading and writing workspace. Serif display type marks the empty-state invitation; compact sans-serif text supports controls and source inspection. Light and dark palettes keep the same information hierarchy.

## Implementation decisions

- Official shadcn CLI initialized `components.json`, Tailwind styling, and local Button/Textarea source under `src/components/ui/`. The application imports those local components.
- The selected theme lives in `localStorage` as `di-theme`. A small prepaint script applies it before React renders; the client theme button exposes a translated name and `aria-pressed` state.
- The locale remains in the existing cookie. The Server Component sets `<html lang>` and passes it to the workspace; the question request continues sending `locale` explicitly.
- The visible file-selection button opens the existing file input. The input still supplies FormData to the existing upload Server Action; a localized status shows the selected filename and resets after a successful upload.
- Source citation buttons still select a stored passage; the mobile source region opens when a citation is selected.
- Groq mode is labeled only when a server key exists. The no-key mode continues to describe retrieved passages as evidence, not an AI answer.

## Boundaries

This UI does not change parsing, retrieval, model validation, workspace storage, quotas, or retention. Local shadcn components are source files; no component registry is queried at application runtime. The current local app has no public deployment or production database.
