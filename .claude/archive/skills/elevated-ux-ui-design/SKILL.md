---
name: HBC Elevated UI/UX Design
description: Subtle envelope-pushing UI/UX for HBC Project Controls SPFx suite – elevating typical enterprise baseline (2/10) to refined premium construction-tech experience (4.75/10) using Fluent UI v9, Griffel, and construction-specific polish while maintaining performance and accessibility
version: 1.0
category: ui-ux-design
triggers: ui, ux, design, elevated, envelope, fluent-ui, griffel, patterns, dashboard, table, form, motion, hierarchy, visual polish, micro-interactions, UX_UI_PATTERNS.md
updated: 2026-02-22
---

# HBC Elevated UI/UX Design Skill

**Activation**  
Implementing, modifying, or extending any UI component, page layout, dashboard, data table, form, navigation element, or visual treatment across the HBC Project Controls application after activation of elevated design principles (post 22 Feb 2026).

**Protocol**  
1. All UI/UX must start from Fluent UI v9 components and design tokens; elevation achieved only via Griffel `makeStyles` and theme overrides.  
2. Default to 4.75/10 elevated patterns; baseline 2/10 only with explicit user approval and feature flag `uiElevatedExperienceV1`.  
3. Every design references `.claude/UX_UI_PATTERNS.md` for current principles and this skill for elevation rules.  
4. Motion limited to Fluent motion tokens (150-250 ms, cubic-bezier easing); always respect `prefers-reduced-motion`.  
5. Role- and context-aware: field users receive high-contrast/glare-safe variants; executives receive subtle depth and hierarchy.  
6. Every enhanced component must include Storybook story with performance impact statement (“+1.2 kb CSS-only”).  
7. New patterns must be cross-documented into `.claude/UX_UI_PATTERNS.md` immediately after implementation.  
8. Post-change verification: update CLAUDE.md §4/§16/§21, run visual regression + full a11y suite.
9. 

**6 Critical Flows Guaranteed Stable**  
1. Dashboard widgets → layered metric cards with subtle hover lift, trend sparklines, and shimmer skeletons on refresh.  
2. TanStack Tables → enhanced rows with accent bars, hover translate(2px), inline status pills with micro-pulse.  
3. Forms & Wizards → polished horizontal/vertical stepper, optimistic validation, elegant focus rings with HBC orange accent.  
4. App Launcher & Contextual Sidebars → tile hover scale(1.01), role-based icon polish, smooth workspace transitions.  
5. Documents modules → elevated Fluent DocumentCard with hover previews and consistent embedded viewer transitions.  
6. Mobile Field Views (QA/QC & Safety) → refined bottom nav and drawer with construction-grade shadows and touch targets.

**Manual Test Steps**  
1. Open any dashboard → confirm cards have subtle depth and premium hover interaction (not flat Fluent).  
2. View any data table → verify row hover, accent bars, and status indicators feel refined.  
3. Complete a multi-step form flow → ensure stepper progress and feedback animations are smooth and professional.  
4. Switch workspaces via App Launcher → confirm visual consistency across Preconstruction, Operations, Share Services, QA/QC.  
5. Test on mobile viewport + high-glare simulation → validate readability, touch targets, and no breakage of elevation.  
6. Enable `prefers-reduced-motion` and high-contrast mode → verify graceful degradation to baseline behavior.

**Reference**  
- `CLAUDE.md` §4 (Core Architecture Patterns – UI/UX), §21 (Navigation & Suite UX Architecture), §16 (Active Pitfalls & Rules)  
- `.claude/UX_UI_PATTERNS.md` (Fluent UI v9 and construction UX principles)  
- HBC Child-App Structure Skill (workspace and navigation context)  
- `.claude/skills/permission-system/SKILL.md` (role-aware UI treatment)  
- Owner UI/UX elevation outline (22 Feb 2026)