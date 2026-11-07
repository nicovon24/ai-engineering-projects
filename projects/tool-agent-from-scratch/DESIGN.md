# Design system: Tool Agent from Scratch

The local workspace follows the repository's warm reading direction. It uses its own tokens and components; no sibling app is a runtime dependency.

## Visual direction

Use a quiet workbench: a narrow note rail, a readable question and answer column, and an execution inspector. The trace is the distinctive feature. It shows each planner decision, validated tool call, result, and stop reason without dumping note bodies into log rows. The answer cites a note ID that opens its original content.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Ground | `#f7f3ed` | `#1d1c1b` |
| Paper | `#fffdf9` | `#262522` |
| Rail | `#f1ebe3` | `#171717` |
| Ink | `#2d2824` | `#f4eee7` |
| Muted | `#62574f` | `#bbb5ae` |
| Border | `#e5dbd1` | `#403e3a` |
| Action | `#a64d2c` | `#e69a72` |
| Action soft | `#f3e0d5` | `#372a24` |

Georgia carries the single prominent heading. Geist or a system sans carries controls and reading text. Monospace is limited to tool names, IDs, and decision counts. Use 16 px body text, at least 14 px supporting text, clear focus rings, and 40-44 px controls.

## Responsive layout

At desktop width, the notes rail, main conversation, and trace inspector occupy three regions. At narrower widths, the note and trace regions stack below the main flow, with source inspection reachable from every citation. No region may require horizontal page scrolling. Spanish is the initial locale and the interface persists explicit Spanish/English and light/dark choices locally.

## States

Show an empty invitation with two fictional example questions, a working state, a completed answer with note citation, and explicit rejected, tool-error, and step-limit outcomes. The UI must label this first planner as deterministic; it must not imply a live model call.
