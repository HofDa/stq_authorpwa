Before making ANY code changes, always do the following:

Read and understand:
AI/AGENT_GUIDE.md
AI/ARCHITECTURE.md
AI/CURRENT_STATE.md
AI/DECISIONS.md
AI/KNOWN_ISSUES.md
Act as the ORCHESTRATOR agent first.
Do NOT immediately start coding.
First:
audit the relevant architecture
identify affected systems
identify risks
identify edge cases
identify likely regressions
explain the root cause or implementation strategy
Then:
create an UPDATED PLAN
split the work into safe PR-sized tasks
assign the correct subagent role(s)
explain why the chosen approach is the safest minimal-diff solution
Always preserve:
runtime/UI separation
schema contracts
mobile-first behavior
offline/PWA behavior
existing architecture boundaries
design token system
Always avoid:
broad rewrites
unrelated cleanup
utility explosion
hidden global state
unnecessary abstractions
runtime logic inside UI
direct sensor access from UI
hardcoded style forks
Use specialized subagents when appropriate:
architecture-guardian
runtime-engineer
sensor-engineer
mobile-studio
ui-designer
authoring-ux
schema-guardian
pwa-offline
qa-auditor
performance-guardian
map-gps
interaction-designer
content-flow
accessibility
security-privacy
release-manager
After implementation:
run verification
run lint/typecheck/build when possible
check regressions
verify mobile behavior if relevant
verify schema compatibility if relevant
verify PWA/cache behavior if relevant
Never claim success without verification.
After meaningful changes, update:
AI/CURRENT_STATE.md
AI/DECISIONS.md
AI/KNOWN_ISSUES.md
When context becomes large:
create a compressed session summary
continue from compressed context instead of carrying unnecessary history

Core philosophy:
Small safe PRs.
Minimal diffs.
Stable architecture.
Production-ready code.
No slop.
No spaghetti.
Verification over assumptions.