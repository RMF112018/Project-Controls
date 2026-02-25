---
name: SKILLS_OVERVIEW | description: Index of all active Anthropic Skills for HBC Project Controls | triggers: skills,overview,index | updated: 2026-02-25
---

# HBC Project Controls – Active Skills Index (20 Active Skills)

| Skill Folder                               | Category           | Primary Triggers                                      | Primary Use Case |
|--------------------------------------------|--------------------|-------------------------------------------------------|------------------|
| spfx-performance-diagnostics-and-bundle    | performance        | bundle, chunk, analyze, profiler, high-roi, verify-bundle-size, top 10 | Bundle reduction & profiler-driven diagnostics |
| react-context-and-concurrent               | performance        | context, appcontext, re-render, cascade, useTransition, useDeferredValue, concurrent | Context re-render elimination & React 18 concurrent features |
| tanstack-router-stability-spfx             | router             | tanstack router, router stability, useRef router, router recreation, navigation freeze, project picker freeze, router.update, updateContext | Stable singleton pattern for TanStack Router v1 preventing route-tree recreation and UI freezes |
| tanstack-query-and-virtualization          | performance        | query key, over-fetch, staleTime, gcTime, virtualization, 200 rows, tanstack table | Query-key stability & virtualization enforcement |
| schedule-data-layer-and-offline-deployment | schedule           | idataservice schedule, reconcileScheduleImport, dexie, localdataservice, tauri, offline queue, dual deployment | Schedule data layer, reconciliation & offline/Tauri deployment |
| schedule-cpm-engine                        | schedule           | cpm, scheduleengine, forward pass, backward pass, float, critical path, wasm | Core CPM engine implementation |
| schedule-interactive-visualization         | schedule           | gantt, echarts gantt, drag drop, work plan board, xyflow, swimlanes, ppc tracking | Interactive Gantt, Work Plan Board & diagrammatic canvas |
| schedule-what-if-sandbox-and-monte-carlo   | schedule           | what-if, sandbox, monte carlo, risk simulation, forensic | What-If scenarios & Monte Carlo analytics |
| schedule-performance-optimization          | schedule           | schedule performance, 10k activities, large gantt, virtual, worker | Extreme-scale schedule performance (10k+ activities) |
| hbc-navigation-ux-hierarchy                | ux-navigation      | navigation, sidebar, mac-bar, project-picker, cmd+k, command-palette, hierarchy, breadcrumbs | Navigation hierarchy splitting, top tabs, unified palette, breadcrumbs |
| hbc-advanced-project-picker-v2             | ux-project-picker  | project-picker, enhanced-picker, optimistic-project-switch, favorites, recent-projects, recommended-projects, shell-overlay, kpi-preview | Advanced intelligent project picker to 11/10 with rich HbcCard previews, role recommendations, optimistic switch |
| hbc-testing-coverage-enforcement-spfx      | testing            | coverage, 95%, ratchet, threshold, phase 1, phase 2, jest.config, pr-validation, test:ci, test:coverage | Phased >95% coverage enforcement & CI stability |
| tanstack-jest-testing-patterns-spfx        | testing            | renderWithProviders, tanstack query test, router test, optimistic mutation, permission matrix | TanStack-specific Jest/RTL testing patterns |
| playwright-e2e-spfx                        | testing            | playwright, e2e, .spec.ts, test file, admin test, provisioning, template edit, dev-user switcher, slide-out panel, fluent ui panel, resilient locators, idempotent test | World’s leading Playwright E2E specialist for SPFx applications (React 18, TypeScript 5, Fluent UI v9, TanStack Router v1, @hbc/sp-services). Generates complete, production-ready, zero-flake, idempotent E2E tests directly from natural-language user journeys while strictly enforcing project fixtures, storageState, Page Object Model patterns, data-testid preference, and SPFx/Fluent UI rendering resilience. |
| permission-system                          | permissions        | role, permission, RBAC, RoleGate, FeatureGate, admin role screen, global vs scoped, Entra ID, SOC2 | Configuration-driven RBAC with 6 core roles, global/scoped access, and SOC2 audit |
| clean-tanstack-integration                 | router             | clean tanstack, router reconstruction, declarative loaders, no adapters, app shell | Post-reconstruction stable declarative TanStack Router + Query for suite architecture |
| enterprise-navigation                      | ux-navigation      | app shell, app launcher, contextual sidebar, pillar removal, workspace navigation | Global App Shell + Top Launcher + Contextual Sidebar (Option 1) for modular suite |
| pluggable-data-backends                    | data               | data provider factory, pluggable backend, Azure SQL, Dataverse, IDataService | Runtime switching between SharePoint, Azure SQL, and Dataverse via factory |
| child-app-structure                        | suite-architecture | child-app, workspace, departmental hub, preconstruction, operations, share services, qa/qc safety, app launcher, contextual sidebar, project hub, documents module, mobile field app | Modular departmental workspace architecture for the HBC Project Controls suite using Global App Shell + Top App Launcher + Contextual Left Sidebar (Option 1) with Preconstruction, Operations, Share Services, and QA/QC & Safety workspaces |
| elevated-ux-ui-design                      | ui-ux              | ui, ux, design, elevated, envelope, griffel, fluent-ui, dashboard, table, form, motion, polish, micro-interactions | HBC Elevated UI/UX Design Skill – Subtle envelope-pushing elevation of typical enterprise baseline (2/10) to refined premium construction-tech experience (4.75/10) |

**Consultation Rule (Mandatory)**  
1. Always follow the exact order in `CLAUDE.md` §0 (core .md guides first).  
2. Then activate the most specific Skill(s) from `.claude/skills/` based on task triggers.  
3. Quote only the exact protocol, checklist, or step required. Never repeat full sections.

**Activation Note**  
Skills use progressive disclosure: only frontmatter is present in the initial context; full content loads on-demand when a trigger matches.

**Maintenance**  
- Archive completed or superseded Skills to `.claude/skills/archive/`.  
- Update this overview whenever Skills are added, consolidated, or retired.

**Reference**  
See individual Skill folders for complete step-by-step protocols.