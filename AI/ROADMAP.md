
---

## `AI/ROADMAP.md`

```md
# Roadmap

## Current Strategic Goal

Build a robust mobile-first authoring app for SouthTyrolQuests that allows creating, editing, previewing, and testing GPS-guided riddle tours with modular interactions.

The system should support:
- non-technical authoring
- structured multilingual content
- reusable riddle modules
- mobile preview and editing
- reliable runtime behavior
- offline/PWA readiness

---

# Phase 1 — Stabilize Project Memory and Agent Workflow

## Goal

Make the project easier for coding agents to understand and modify safely.

## Tasks

- [ ] Add `AI/` project memory folder
- [ ] Add subagent role files
- [ ] Add PR template
- [ ] Add session summary template
- [ ] Add current state file
- [ ] Add decision log
- [ ] Add known issues file
- [ ] Add Claude/Codex bootstrap prompt

## Acceptance Criteria

- Agents know project constraints before coding.
- Work can be split into PR-sized tasks.
- Architecture decisions are recorded.
- Future sessions can start from compressed context.

---

# Phase 2 — Studio Architecture Stabilization

## Goal

Separate shared studio logic from desktop and mobile shells.

## Tasks

- [ ] Extract shared studio controller
- [ ] Rename current studio to `DesktopStudioShell`
- [ ] Create `MobileStudioShell`
- [ ] Remove desktop-only sidebar assumptions from mobile
- [ ] Make phone mockup the primary mobile workspace
- [ ] Add clean routing or mode switching between desktop/mobile shells

## Acceptance Criteria

- Desktop and mobile studio can evolve independently.
- Shared logic is reused where useful.
- No duplicated business logic.
- Mobile studio does not depend on desktop sidebar layout.

---

# Phase 3 — Mobile Authoring UX

## Goal

Make editing on mobile intuitive and app-like.

## Tasks

- [ ] Add edit mode toggle on map/preview screen
- [ ] Add element selection overlay
- [ ] Add second-tap or action to open edit drawer
- [ ] Add right-side contextual edit drawer
- [ ] Add drawer open/close gestures
- [ ] Add safe dismiss behavior
- [ ] Add selected element highlighting
- [ ] Add mobile keyboard handling
- [ ] Add unsaved-change protection

## Acceptance Criteria

- User can enter and leave edit mode clearly.
- Selected elements are visible.
- Drawer does not trap the user.
- Touch targets are usable.
- Editing feels connected to the phone preview.

---

# Phase 4 — Author-Friendly Editing Flows

## Goal

Make complex tour/riddle editing understandable for normal authors.

## Tasks

- [ ] Rename technical runtime labels to author-friendly labels
- [ ] Add template-first riddle wizard
- [ ] Add guided station creation
- [ ] Add step-based sequence editor
- [ ] Add clear validation messages
- [ ] Add empty states
- [ ] Hide developer panels behind expert mode
- [ ] Add multilingual field guidance

## Acceptance Criteria

- Authors do not need to understand runtime internals.
- Common riddle types can be created from templates.
- Validation errors explain what to fix.
- Expert controls do not clutter default UI.

---

# Phase 5 — Reactive Riddle Runtime Completion

## Goal

Make the runtime robust, modular, and testable.

## Tasks

- [ ] Audit existing runtime contracts
- [ ] Add or stabilize sequence handling
- [ ] Add `all_of` composite support if needed
- [ ] Add `any_of` composite support if needed
- [ ] Add timeout handling
- [ ] Add retry behavior
- [ ] Add runtime error recovery
- [ ] Add guided test mode
- [ ] Add runtime debug output for expert mode

## Acceptance Criteria

- Runtime behavior is deterministic.
- Invalid data fails safely.
- Interaction modules remain isolated.
- Runtime can be tested without UI where possible.

---

# Phase 6 — Real Sensor Runtime Bridge

## Goal

Connect runtime interactions to real mobile device APIs safely.

## Tasks

- [ ] Add sensor adapter interface
- [ ] Add compass service bridge
- [ ] Add orientation service bridge
- [ ] Add gyroscope/accelerometer bridge
- [ ] Add GPS bridge
- [ ] Add permission handling
- [ ] Add unavailable sensor fallback
- [ ] Add runtime-safe normalized sensor values

## Acceptance Criteria

- UI does not access raw sensor APIs directly.
- Runtime receives normalized sensor values.
- Permission denial is handled gracefully.
- Browser/device limitations are explicit.

---

# Phase 7 — Sensor Stability and Field Testing

## Goal

Make sensor-based riddles reliable enough for real-world use.

## Tasks

- [ ] Add compass smoothing
- [ ] Add sensor throttling
- [ ] Add deadzone filtering
- [ ] Add calibration helper
- [ ] Add Android compass jitter mitigation
- [ ] Add field-test page
- [ ] Add sensor diagnostics panel
- [ ] Add low-end device checks
- [ ] Add manual fallback options for fragile interactions

## Acceptance Criteria

- Compass does not visibly jitter under normal conditions.
- Sensor UI remains responsive.
- Battery impact is reasonable.
- Field testing can reveal device-specific issues.

---

# Phase 8 — New Riddle Modules

## Goal

Add reusable interaction modules after runtime and sensor foundations are stable.

## Candidate Modules

- [ ] QR scanner
- [ ] NFC interaction
- [ ] timer/wait module
- [ ] manual photo-check module
- [ ] object-found manual confirmation
- [ ] compass alignment
- [ ] tilt angle
- [ ] hold-still condition
- [ ] proximity/GPS radius
- [ ] sequence module

## Acceptance Criteria

- Each module has clear schema.
- Each module has author-friendly UI.
- Each module has runtime behavior.
- Each module has fallback/permission UX where relevant.
- Each module can be tested independently.

---

# Phase 9 — Map and GPS Reliability

## Goal

Make location-based tour behavior reliable and understandable.

## Tasks

- [ ] Audit map marker behavior
- [ ] Add GPS radius visualization
- [ ] Add location permission UX
- [ ] Add poor GPS accuracy state
- [ ] Add station unlock testing
- [ ] Add route preview checks
- [ ] Add map/drawer gesture conflict handling

## Acceptance Criteria

- Users understand when they are close enough.
- GPS failure does not feel like app failure.
- Map interactions remain usable on mobile.
- Station unlocking is testable.

---

# Phase 10 — PWA and Offline Robustness

## Goal

Make the app reliable under weak network and deployment updates.

## Tasks

- [ ] Audit service worker strategy
- [ ] Audit cache invalidation
- [ ] Add app update flow if needed
- [ ] Test offline reload
- [ ] Test stale bundle recovery
- [ ] Protect local draft data
- [ ] Test installed PWA behavior
- [ ] Add storage migration strategy if needed

## Acceptance Criteria

- Users do not get stuck on old versions.
- Offline behavior is predictable.
- Local data is not lost accidentally.
- Deployment updates are testable.

---

# Phase 11 — QA, Accessibility, and Release Hardening

## Goal

Prepare the authoring app for stable real-world use.

## Tasks

- [ ] Add QA checklist
- [ ] Add mobile smoke test plan
- [ ] Add accessibility audit
- [ ] Add keyboard/focus checks
- [ ] Add contrast checks
- [ ] Add release checklist
- [ ] Add changelog template
- [ ] Add regression test plan

## Acceptance Criteria

- Each PR has clear verification.
- Accessibility blockers are visible.
- Release risks are documented.
- Regression-prone areas are known.

---

# Later / Maybe

## Advanced Ideas

- [ ] AI-assisted tour generation
- [ ] AI-assisted station text refinement
- [ ] local vector memory for repeated project knowledge
- [ ] reusable riddle template library
- [ ] field-mode authoring from GPS location
- [ ] offline media package export
- [ ] tour validation dashboard
- [ ] multi-agent review pipeline
- [ ] visual regression testing
- [ ] Figma/design-token sync

---

# Current Recommended Next PRs

1. Add `ui-designer.md` subagent.
2. Finalize `AI/AGENT_GUIDE.md`, `AI/ARCHITECTURE.md`, and `AI/ROADMAP.md`.
3. Create Claude/Codex bootstrap prompt.
4. Run first architecture audit using `architecture-guardian`.
5. Create PR plan for mobile studio shell separation.