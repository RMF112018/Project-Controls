---
name: HBC Navigation UX Hierarchy & Intelligent Project Picker
description: 11/10 construction-grade Mac bar, sidebar splitting, unified Cmd+K command palette, rich project picker, and navigation refinements for HBC Project Controls
version: 1.0
category: ux-navigation
triggers: navigation, sidebar, mac-bar, project-picker, enhanced-picker, cmd+k, command-palette, hierarchy, breadcrumbs, optimistic-switch, shell-overlay, favorites, recent-projects, kpi-preview
updated: 2026-02-21
---

# HBC Navigation UX Hierarchy & Intelligent Project Picker Skill

**Activation**  
Any request involving navigation layout, Mac bar, NavigationSidebar, project picker enhancements, Cmd/Cmd+K, command palette unification, breadcrumbs, top-level tabs, or UX/UI refinements to project switching and context navigation.

**High-ROI Protocol**  
1. Verify current state via AppShell.tsx (Mac bar), NavigationSidebar.tsx, project picker component(s), and TanStack Router guards at commit c76af8d baseline.  
2. Enforce 11/10 construction UX: 5-pillar top tabs (Hub | Precon | Ops | Admin | Reports), context-only sidebar, rich HbcCard previews (Stage/Status/KPIs) in picker, unified HbcCommandPalette, shell hydration overlay, Fluent-token transitions.  
3. Align strictly to existing patterns: HbcMotion (max 300 ms, reduced-motion), FeatureGate/RoleGate/PermissionGate, TanStack Router v1 preload/guards, HbcCard/KPICard/StageBadge reuse, HbcTanStackTable virtualization.  
4. Capture diagnostics: keyboard navigation + a11y audit, before/after perceived latency (project switch < 400 ms), bundle impact check.  
5. Deliver minimal diff-ready changes + exact ready-to-insert CLAUDE.md diffs for §§4, 7, 15 and UI/Navigation subsection.  
6. Re-verify with Playwright (switch + keyboard + mobile flows) and Storybook dark-mode variants; confirm zero jank for field PM workflows.

Reference: CLAUDE.md §§4 (Core Architecture Patterns), §15 (Current Phase Status), UI Components / Navigation subsection, and `PERFORMANCE_OPTIMIZATION_GUIDE.md` §5 (for any motion/bundle side-effects).