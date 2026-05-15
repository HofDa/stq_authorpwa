# Style Import Order

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
