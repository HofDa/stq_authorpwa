# Mobile QA Checklist

Use this for any change touching field mode, studio layout, map panels, drawers, station cards, story input or assistant UI.

## Viewports

- [ ] Small Android width around 360 px
- [ ] iPhone-like width around 390 px
- [ ] Larger mobile around 430 px
- [ ] Tablet-ish width if layout changes affect breakpoints

## Interaction checks

- [ ] Primary action is visible without hunting.
- [ ] Touch targets are large enough.
- [ ] Right drawer/sheet can open and close reliably.
- [ ] Drawer does not permanently trap focus or block critical controls.
- [ ] Keyboard opening does not hide the active input permanently.
- [ ] Map remains usable when panels are open.
- [ ] Scrolling feels natural and does not create double-scroll traps.

## Field-use checks

- [ ] Works with weak network except explicitly online-only features.
- [ ] Empty states are understandable.
- [ ] Error states offer recovery.
- [ ] GPS/map controls remain reachable.
