# Warm interface foundation

Document Intelligence is the first implementation of this optional visual foundation. Future projects can adopt the roles and proportions below while keeping their own stylesheets, components, and deployment independent. The [Document Intelligence design system](../projects/document-intelligence/DESIGN.md) records the implemented values.

## Portable direction

- Use a restrained terracotta orange for primary actions, selected state, visible focus, and source links. Keep secondary actions neutral so the primary task is apparent.
- Pair warm paper surfaces with dark brown ink in light mode. Compose dark mode with brown-charcoal surfaces and a lighter orange action color; remap semantic roles instead of inverting colors.
- Use a literary serif for one prominent heading and a clear sans serif for controls, document text, and chat. Start body text at 16 px, supporting text near 14 px, and primary touch controls at least 44 px high; compact toolbar controls can be 40 px where space is limited.
- Use 4 px increments for spacing. Group controls and their labels tightly; separate task regions more generously. Keep long content inside its owning scroll region.
- Reserve rounded corners for controls and task containers. Use borders for region separation, with one soft offset shadow only where a floating composer needs depth.
- Maintain at least WCAG AA contrast for text and visible focus. Ensure color never carries the only status cue.

## Project adoption

Copy the semantic roles and adapt them to the new project's task and content. Keep tokens local to that project. Check the new app at narrow mobile and desktop sizes, in both themes if both are offered, before claiming the foundation is implemented there. This document does not change any other project's UI automatically.
