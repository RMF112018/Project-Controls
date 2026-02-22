---
name: HBC Advanced Project Picker V2
description: 11/10 intelligent, construction-grade project switching with rich HbcCard KPI previews, role-based recommendations, optimistic updates, favorites/recent sections, unified Cmd+K command palette, Mac-bar live status, and zero-jank shell hydration
version: 1.0
category: ux-project-picker
triggers: project-picker, enhanced-picker, advanced-picker, optimistic-project-switch, favorites, recent-projects, recommended-projects, mac-bar-pill, command-palette, shell-overlay, kpi-preview, project-context, star-toggle
updated: 2026-02-21
---

# HBC Advanced Project Picker V2 Skill

**Activation**  
Any request involving project picker enhancements, Mac bar project switching, Recent/Favorites/Recommended sections, star toggles, optimistic UI, rich previews, unified Cmd/Cmd+K, shell overlay, or elevating project navigation UX in the HBC Project Controls application.

**High-ROI Protocol**  
1. Verify current state of AppShell.tsx (Mac bar), ProjectPicker components, TanStack Router guards, ProjectService/UserProfileService, and feature flag `uxEnhancedProjectPickerV2` at commit c76af8d.  
2. Design exclusively for 11/10 construction UX: instant visual health (StageBadge/StatusBadge + 3 KPIs + last activity in HbcCard), role-aware “Recommended for You”, Recent (5 horizontal), Favorites (draggable star toggle), fuzzy search + hover preview pane, Mac-bar live status pill with pending skeleton.  
3. Enforce strict fidelity: reuse HbcCard/KPICard/StageBadge/HbcTanStackTable, TanStack Query v5 optimistic mutations (onMutate/rollback), Fluent v9 tokens + HbcMotion.stagger (max 300 ms, reduced-motion safe), FeatureGate/RoleGate/PermissionGate.  
4. Capture diagnostics: keyboard navigation + a11y audit, project-switch perceived latency (< 400 ms), bundle impact.  
5. Deliver only minimal diff-ready changes + exact ready-to-insert CLAUDE.md blocks for §§4,5,7,15 and UI/Navigation.  
6. Re-verify with Storybook (light/dark/mobile variants), Playwright (optimistic rollback, keyboard, mobile flows), and `npm run verify:bundle-size`.

Reference: CLAUDE.md §§4 (Core Architecture Patterns), §7 (Service Methods), §15 (Current Phase Status), UI Components/Navigation subsection, HBC Navigation UX Hierarchy skill, and `PERFORMANCE_OPTIMIZATION_GUIDE.md` §5.