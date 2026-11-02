# Visual foundation review

Date: 2026-11-01. Scope: the local Document Intelligence UI. The existing document and answer behavior was not re-evaluated here.

## Observed review

- The first desktop capture exposed small supporting text, a short question field, compact controls, and a green accent. The updated captures show larger controls and text, warm light and dark surfaces, and orange on primary actions, focus, citation roles, and the app icon.
- Playwright CLI inspected the empty desktop workspace at 1440 × 900 in both themes, the mobile empty state at 390 × 844 and 320 × 700, and the document panel at 390 × 844. The file picker and upload action accepted one synthetic TXT document.
- A browser route simulated an insufficient-evidence response without contacting Groq. One short conversation was visually checked at 390 × 844. Four synthetic messages then exercised history overflow; after the latest message, `scrollTop + clientHeight` equaled `scrollHeight` (437 + 396 = 833). The compositor remained visible.
- Measured at 320 × 700, 390 × 844, 1024 × 768, and 1440 × 900: the document width matched the viewport width, the shell height matched the viewport height, and the composer bottom stayed inside the viewport. At 320 × 700 the redundant empty-chat prompt is intentionally hidden so the composer remains available.
- A keyboard check focused the new skip link: its outline was visible, and Enter moved focus to `#workspace-main`.
- Calculated contrast for representative token pairs: light body 14.35:1, light muted text 6.90:1, light orange on pale orange 4.75:1, light primary button 5.65:1; dark body 13.90:1, dark muted text 8.18:1, dark orange on its pale surface 5.46:1, dark primary button 7.15:1.
- The current [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) informed the pass: a skip link, named question field, persistent visible focus, responsive controls, and explicit color scheme were checked. Impeccable's mechanical detector exited successfully and reported advisory token-scale drift for some existing literal font sizes, radii, and overlay shadow values; it did not report a blocking failure.
- An independent, read-only Impeccable finish review returned **ship** for the inspected code and supplied captures, with no material accessibility, responsive, contrast, or hierarchy issue. It did not run a browser, keyboard, zoom, or short-height check. Requested reviewer model and effort: `gpt-6-sol` high; runtime-confirmed model and effort: unconfirmed.

## Gates and limits

`npm run build`, `npm run lint`, and `git diff --check` passed. The question response was mocked in the browser; this review does not establish live Groq behavior, answer quality, or semantic citation support. Browser screenshots and the synthetic file stayed in ignored `.playwright-cli/` files. The user-visible UI remains a local prototype.
