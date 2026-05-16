# Style Import Order

`src/styles/tokens.css` is the canonical source of design-token values for the
app. TypeScript bridges such as `src/theme/tokens.ts`, Tailwind config, inline
React styles, MapLibre paint token resolution and the PWA manifest should point
back to those custom properties rather than introducing duplicate color values.

`src/theme/tokens.test.ts` guards this contract by failing on shared `--stq-*`
references that are not defined in `tokens.css`, and on `var(--stq-..., #hex)`
fallbacks that would hide token drift. Component-local custom properties are
allowed only for scoped behavior, not shared design values.

`src/index.css` is the only global style entrypoint. Keep its order intact:

1. Tailwind, tokens and foundation.
2. Studio and RRR editor base styles.
3. Phone preview and shared riddle/player styles.
4. Map/workspace styles, with workspace overrides last.

Small aggregator files such as `phone-preview.css`, `map-workspace.css` and
`rrr-module-editors.css` preserve the old cascade position while delegating to
responsibility-focused files under `workspace/` and `rrr/`.

Do not move mobile viewport, pointer, sheet, drawer or map overflow rules across
these boundaries without a visual and mobile interaction regression pass.
