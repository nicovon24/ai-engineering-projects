# System design

The [overview SVG](overview.svg) shows the implemented local web path. Its editable [HTML source](overview.html) follows the repository's warm diagram palette. The diagram keeps six main components and eight relationships: the HTTP route is represented by the connection from the bilingual UI to the bounded loop.

## Components and flow

1. The Next.js workspace accepts a question and an explicit `es` or `en` locale. `POST /api/run` validates the payload and passes both to the server-side loop. `GET /api/notes` serves the two bundled fictional notes for source inspection.
2. The loop calls the deterministic planner with `{request, locale, outcomes}`. A provider adapter is a later feature.
3. A planner decision is `{kind: "tool", name, args}` or `{kind: "final", answer, noteIds}`. The loop counts every decision, including final, against a limit of four. It accepts citations only for note IDs returned by `read_note` in that run; inline citation markup in an answer is rejected.
4. The registry accepts only `search_notes` and `read_note`. Exact argument schemas reject unknown keys and invalid values. A fixed in-memory manifest limits reads to bundled note IDs; there are no arbitrary paths or URLs.
5. The loop returns `{status, answer?, noteIds, error?, trace}`. The UI renders the answer, validated citations, original note text, and a compact ordered trace. Trace entries contain metadata rather than note bodies.

## Stops and trust boundaries

The loop can complete, reject an invalid decision or answer, stop on a tool error, or reach the four-decision limit. Terminal states cannot invoke more tools. The route bounds request size and length before the planner runs. Planner proposals are validated at the registry boundary even though the current adapter is deterministic. The UI treats the structured `noteIds` as citations; search hits never become citations on their own.

This MVP has no model call, uploads, web access, memory, write tools, database, or credentials. The earlier independent CLI design remains a later task in [Feature 01](../docs/features/01-bounded-agent/requirements.md).
