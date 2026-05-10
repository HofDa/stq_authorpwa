# Architecture

## Project Overview

SouthTyrolQuests Authoring App is a mobile-first PWA for creating and editing GPS-guided riddle tours.

The system combines:
- tour management
- station editing
- multilingual content
- map/GPS-based station logic
- modular riddle interactions
- runtime previews
- mobile and desktop authoring shells
- offline/PWA behavior

The architecture is designed around:
- modularity
- isolated runtime logic
- reusable interaction modules
- schema-driven behavior
- small incremental evolution
- mobile-first UX

---

# High-Level Architecture

```text
Authoring UI
↓
Studio Shells
↓
Editor State / Forms
↓
Schema Validation
↓
Tour & Riddle Data
↓
Reactive Riddle Runtime
↓
Interaction Modules
↓
Sensor / Platform Adapters
```

---

# Main Layers

## 1. Authoring UI

Responsible for:
- forms
- station editing
- tour editing
- multilingual content editing
- preview controls
- author guidance
- onboarding
- validation display

Must NOT contain:
- runtime execution logic
- raw sensor handling
- schema migration logic
- hidden platform-specific logic

Core principle:
The UI should remain understandable for non-technical authors.

---

## 2. Studio Shells

Responsible for:
- desktop studio layout
- mobile studio layout
- phone mockup workspace
- edit mode
- drawers
- overlays
- selection states
- responsive behavior

Important rule:

Desktop and mobile shells may share controller logic, but shell-specific UI should remain separated.

Examples:
- DesktopStudioShell
- MobileStudioShell

Core principle:
Shared logic where useful, separate presentation where necessary.

---

## 3. Editor State Layer

Responsible for:
- selected tour
- selected station
- selected editable element
- draft changes
- save/cancel flow
- validation state
- editor UI state

Important rule:

Editor state must NOT leak into runtime execution.

The runtime must remain usable independently from editor internals.

---

## 4. Schema / Data Layer

Responsible for:
- tour JSON
- station JSON
- riddle JSON
- interaction schemas
- multilingual content structure
- validation
- migrations
- backwards compatibility

Core principle:
Schema changes require migration thinking.

Important constraints:
- preserve stable JSON contracts
- preserve multilingual structure
- runtime and editor must share assumptions

---

## 5. Reactive Riddle Runtime (RRR)

Responsible for:
- interaction execution
- sequencing
- conditions
- retries
- timeout handling
- validation
- success/failure states
- runtime orchestration

Examples:
- sequence
- all_of
- any_of
- compass_align
- hold_still
- QR interaction
- timer/wait modules

Core principle:
The runtime should stay framework-independent where possible.

Important rule:
Runtime logic must not depend directly on React/UI state.

---

## 6. Interaction Modules

Responsible for:
- reusable interaction behavior
- isolated interaction logic
- sensor interaction abstraction
- interaction-specific validation
- interaction-specific feedback

Examples:
- QR
- NFC
- compass
- tilt
- camera
- GPS proximity
- timer
- manual confirmation

Core principle:
Interactions should be reusable and independently testable.

---

## 7. Sensor / Platform Adapter Layer

Responsible for:
- compass
- gyroscope
- accelerometer
- orientation
- GPS
- camera
- NFC
- browser APIs
- permission handling

Core principle:
UI must NOT directly access raw sensor APIs.

The adapter layer normalizes:
- noisy data
- browser differences
- device differences
- permission flows

Important constraints:
- Android fragmentation
- iOS Safari limitations
- inconsistent update frequencies
- battery usage

---

# Dependency Direction

Allowed:

```text
UI → Editor State → Schema/Data → Runtime → Adapters
```

Avoid:

```text
Runtime → UI
Adapters → UI
Schema → React Components
Sensor APIs → UI Components
```

Core principle:
Dependencies should flow downward.

Lower layers should not know about upper layers.

---

# Architectural Principles

## 1. Mobile First

The system is designed primarily for mobile usage.

Desktop enhances productivity but does not define architecture.

---

## 2. Minimal Diffs

Prefer:
- small PRs
- incremental changes
- reversible changes

Avoid:
- broad rewrites
- unrelated cleanup
- architecture resets

---

## 3. Runtime Isolation

The runtime should remain:
- reusable
- portable
- predictable
- testable

Avoid:
- React coupling
- editor assumptions
- hidden global state

---

## 4. Schema Stability

JSON contracts are important.

Breaking changes require:
- migration thinking
- compatibility analysis
- runtime/editor coordination

---

## 5. Explicitness over Cleverness

Prefer:
- readable code
- explicit flow
- understandable naming
- clear ownership

Avoid:
- magical abstractions
- utility dumping grounds
- hidden side effects

---

## 6. Offline-First Thinking

PWA behavior must be intentional.

Important concerns:
- cache invalidation
- stale assets
- local persistence
- deployment updates
- installed PWA behavior

---

# Important Architectural Risk Areas

## Runtime/UI Coupling

Risk:
Runtime logic slowly leaking into React components.

Avoid:
- runtime decisions inside UI
- sensor access inside visual components

---

## Schema Drift

Risk:
Editor and runtime expecting different structures.

Avoid:
- changing field names casually
- hidden assumptions
- undocumented migrations

---

## Mobile Gesture Conflicts

Risk:
Drawers, overlays, maps, and gestures fighting each other.

Avoid:
- stacked gesture systems
- hidden edit state
- impossible dismiss flows

---

## Sensor Instability

Risk:
Compass jitter, gyroscope drift, noisy sensor data.

Avoid:
- raw sensor rendering
- high-frequency rerender loops
- assumptions about device quality

---

## PWA Cache Problems

Risk:
Old assets surviving deployments.

Avoid:
- uncontrolled caching
- untested service worker changes
- hidden stale bundle behavior

---

## CSS Fragmentation

Risk:
Local style forks and duplicated colors.

Avoid:
- hardcoded colors
- duplicated spacing systems
- component-specific theme hacks

Use:
- design tokens
- semantic variables
- shared layout rules

---

# Preferred Development Style

Good:

```text
PR 1: Extract shared studio controller
PR 2: Add mobile edit mode
PR 3: Add selection overlay
PR 4: Add edit drawer
PR 5: Add drawer gestures
```

Bad:

```text
Rewrite complete editor architecture and runtime in one PR.
```

---

# Architecture Review Questions

Before implementation ask:

- Does this preserve runtime/UI separation?
- Does this change JSON contracts?
- Does this require migration?
- Is this mobile-safe?
- Is this offline-safe?
- Can this be tested independently?
- Is this the smallest safe change?
- Does this introduce unnecessary abstraction?
- Would a future developer understand this quickly?