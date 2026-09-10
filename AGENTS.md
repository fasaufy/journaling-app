<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Motion & Interaction Guidelines

- Hover: subtle lift (translateY -2px) + deeper shadow, 150-200ms ease-out. Don't stack more than 2 visual changes on hover.
- Press/active: scale down to 0.97-0.98, shadow flattens, 80-120ms ease-in. Should feel snappier than the hover transition.
- Focus (inputs): border color transitions to accent (#195eff), optional soft glow ring, 150ms.
- Disabled: no animation, reduced opacity, cursor: not-allowed.
- Entering content (modals, dropdowns, new list items): fade + slight scale/slide in, 200-300ms ease-out.
- Leaving content: fade out, 150-200ms ease-in — faster than entering, since exits shouldn't linger.
- Never use linear easing for UI feedback — always ease-out (entering), ease-in (leaving), or ease-in-out (toggles).
- Apply this consistently across buttons, nav items, calendar cells, and cards — not just the ones explicitly called out in a prompt.