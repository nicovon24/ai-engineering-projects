# System design
\n
\nFour standalone SVGs explain the local MVP. Start with the whole-system flow, then use the three focused views for detail. They use the project's `DESIGN.md` colors and describe implemented behavior; evaluation and task status remain in [the task tracker](../docs/specs/tasks.md).
\n
\n| Diagram | Question it answers |
\n| --- | --- |
\n| [Overview](overview.svg) | How does a proposal move from chat and sources through generation, inspection, and a human decision? |
\n| [Review](review.svg) | How does a draft become an analysis and then a human decision, including source-free completion? |
\n| [Evidence](evidence.svg) | How do proposal claims, generated arguments, authorized passages, and verdicts stay separate? |
\n| [Privacy](privacy.svg) | What stays on this device, what reaches Groq after consent, and what comes back? |
\n
\nEach SVG has an accessible title and description and makes no network requests. Generate the four files with `py -3 system-design/build.py` from the project root. Use `playwright-cli run-code --filename=tests/browser-svg-check.js` while serving this directory at `http://127.0.0.1:8766/` for a browser render check.
\n
\nThe app is local and single-process. It has no accounts, OCR, public deployment, or production storage. Citation IDs prove source scope; they do not prove semantic support.
\n
