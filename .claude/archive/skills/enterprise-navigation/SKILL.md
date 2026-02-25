---
name: Enterprise Navigation for Construction Suite
description: Global App Shell + Top App Launcher + Contextual Left Sidebar (Option 1) pattern for HBC modular suite with Fluent UI v9 and accordion-style sidebar groups
version: 1.1
category: navigation
triggers: app shell, app launcher, contextual sidebar, accordion sidebar, single open group, workspace navigation, pillar tab bar removal
updated: 2026-02-23
---

# Enterprise Navigation Skill

**Activation**  
Implementing or modifying any navigation, App Shell, launcher, sidebar, or workspace routing after PillarTabBar deprecation.

**Protocol**  
1. Single Global App Shell component wraps entire route tree.  
2. Top-right Fluent UI CommandBar button opens App Launcher (grid of departments).  
3. Left sidebar is contextual per workspace and driven by workspaceConfig.ts.  
4. Sidebar uses accordion behavior:  
   - All groups start fully collapsed on workspace load.  
   - Only one group can be expanded at a time (auto-collapse others).  
   - Expanded state is remembered per workspace via localStorage.  
   - Smooth, beautiful collapse/expand animation using Fluent UI motion tokens.  
5. Mobile: automatic drawer + bottom nav; drawer closes when a leaf item is selected.  
6. All navigation uses declarative TanStack Router routes with lazy loading per workspace.  
7. Every navigation action wrapped in stable `useNavigate` from TanStack (no custom adapters).  
8. Post-change verification: a11y test, performance trace, update CLAUDE.md §21.

**6 Critical Flows Guaranteed Stable**  
1. Workspace load → all sidebar groups collapsed.  
2. Expand one group → all others collapse automatically.  
3. Navigate away and return → remembered expanded group restored.  
4. Mobile drawer open → leaf item click closes drawer.  
5. Role-based hiding of launcher/sidebar items via RoleGate.  
6. Future extraction of any workspace → zero navigation changes.

**Manual Test Steps**  
1. Load any workspace → verify all sidebar groups start collapsed.  
2. Expand one group → verify all others collapse.  
3. Navigate away and return to same workspace → verify previously expanded group is restored.  
4. On mobile → open drawer, click leaf item → verify drawer closes.  
5. Log in as different roles → verify correct items visible/hidden.  
6. Run full a11y and bundle tests.

**Reference**  
- `CLAUDE.md` §21 (Navigation & Suite UX), §20  
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` (Phase 3)  
- `UX_UI_PATTERNS.md` §3 (Fluent UI navigation & motion)  
- Owner navigation requirements (22 Feb 2026)