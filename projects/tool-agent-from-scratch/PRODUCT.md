# Tool Agent from Scratch — product outline

**Status: Done for the local web MVP.** The task tracker records the bounded implemented scope and later work.

## Purpose

Make a small tool-using agent inspectable. A learner asks a question about two fictional notes, sees the planner's choices and validated tool calls, opens the note cited by the answer, and understands why the run stopped.

## First local MVP

Build a Next.js workspace around a first-party TypeScript loop. The server owns two read-only fixture tools, `search_notes` and `read_note`. A deterministic planner demonstrates the complete path without a model key. The same loop contract can later accept a provider planner. This version is deliberately honest about its deterministic behavior; it does not claim model reasoning.

The app starts in Spanish, persists an accessible English choice, and passes the selected locale to the planner. It also persists a light/dark theme. Source text remains in its original language. The workspace uses the repository's warm paper, terracotta, and readable evidence treatment while remaining an independent project.

## Boundaries

- No uploaded files, arbitrary paths, web access, shell tools, writes, memory, accounts, or provider calls in the first MVP.
- A maximum of four planner decisions, including the final answer. Invalid calls and tool failures stop with a visible reason.
- Only IDs returned by `read_note` may appear as displayed citations. Trace rows show metadata rather than full note bodies or prompts.
- The local UI accepts a question about the fictional notes. The deterministic planner may return insufficient information; it must not invent a source-backed answer.

## Later

A provider-backed planner, broader question cases, evaluation corpus, and an independently runnable CLI remain separate milestones. The [overview SVG](system-design/overview.svg) shows the implemented web-to-loop path.
