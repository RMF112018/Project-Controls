---
name: SKILLS_OVERVIEW | description: Index of all active Anthropic Skills for HBC Project Controls | triggers: skills,overview,index | updated: 2026-02-21
---

# HBC Project Controls – Active Skills Index (11 Consolidated Skills)

| Skill Folder                               | Category          | Primary Triggers                                      | Primary Use Case |
|--------------------------------------------|-------------------|-------------------------------------------------------|------------------|
| spfx-performance-diagnostics-and-bundle    | performance       | bundle, chunk, analyze, profiler, high-roi, verify-bundle-size, top 10 | Bundle reduction & profiler-driven diagnostics |
| react-context-and-concurrent               | performance       | context, appcontext, re-render, cascade, useTransition, useDeferredValue, concurrent | Context re-render elimination & React 18 concurrent features |
| tanstack-router-stability-spfx             | router            | tanstack router, router stability, useRef router, router recreation, navigation freeze, project picker freeze, router.update, updateContext | Stable singleton pattern for TanStack Router v1 preventing route-tree recreation and UI freezes |
| tanstack-query-and-virtualization          | performance       | query key, over-fetch, staleTime, gcTime, virtualization, 200 rows, tanstack table | Query-key stability & virtualization enforcement |
| schedule-data-layer-and-offline-deployment | schedule          | idataservice schedule, reconcileScheduleImport, dexie, localdataservice, tauri, offline queue, dual deployment | Schedule data layer, reconciliation & offline/Tauri deployment |
| schedule-cpm-engine                        | schedule          | cpm, scheduleengine, forward pass, backward pass, float, critical path, wasm | Core CPM engine implementation |
| schedule-interactive-visualization         | schedule          | gantt, echarts gantt, drag drop, work plan board, xyflow, swimlanes, ppc tracking | Interactive Gantt, Work Plan Board & diagrammatic canvas |
| schedule-what-if-sandbox-and-monte-carlo   | schedule          | what-if, sandbox, monte carlo, risk simulation, forensic | What-If scenarios & Monte Carlo analytics |
| schedule-performance-optimization          | schedule          | schedule performance, 10k activities, large gantt, virtual, worker | Extreme-scale schedule performance (10k+ activities) |
| hbc-navigation-ux-hierarchy                | ux-navigation     | navigation, sidebar, mac-bar, project-picker, cmd+k, command-palette, hierarchy, breadcrumbs | Navigation hierarchy splitting, top tabs, unified palette, breadcrumbs |
| hbc-advanced-project-picker-v2             | ux-project-picker | project-picker, enhanced-picker, optimistic-project-switch, favorites, recent-projects, recommended-projects, shell-overlay, kpi-preview | Advanced intelligent project picker to 11/10 with rich HbcCard previews, role recommendations, optimistic switch |

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