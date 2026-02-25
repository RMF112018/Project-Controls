---
name: Clean TanStack Integration for Suite
description: Declarative, stable, zero-adapter integration pattern for TanStack Router v1 + Query v5 after full reconstruction in the HBC suite architecture
version: 1.0
category: router
triggers: tanstack router, clean integration, router reconstruction, declarative loaders, no adapters, clean data layer, router update, App Shell
updated: 2026-02-22
---

# Clean TanStack Integration Skill

**Activation**  
Any router or data fetching work after the legacy TanStack migration has been declared obsolete (Phase 3 reconstruction).

**Protocol**  
1. Router created once via useRef with static values only (`queryClient`, `dataService`).  
2. All dynamic context injected via `router.update({ context: {...} })` – never recreate router.  
3. Every route uses declarative loaders (no useEffect fetches).  
4. Data access goes through domain-specific hooks that return stable TanStack Query results.  
5. App Shell providers wrap RouterProvider with memoized context objects.  
6. No adapter hooks or bridge components – direct use of TanStack primitives wrapped in stable custom hooks.  
7. Post-change verification: `tsc --noEmit`, `npm run verify:sprint3`, update CLAUDE.md §22.

**6 Critical Flows Guaranteed Stable**  
1. Project switch – optimistic update + declarative loader refresh with no freeze.  
2. Departmental workspace navigation – lazy-loaded route groups load instantly.  
3. Role/permission change – guards re-evaluate via context update without router recreation.  
4. DataProviderFactory switch (future Azure SQL) – transparent to all loaders.  
5. Mobile drawer + sidebar context – no re-render cascades on open/close.  
6. Hub analytics → departmental drill-down – seamless with shared query cache.

**Manual Test Steps**  
1. Load Hub dashboard → switch project → verify no freeze, data updates instantly.  
2. Navigate to Preconstruction workspace → confirm only relevant routes load.  
3. Change role in dev toggle → verify guards update without page reload.  
4. Open/close left sidebar on mobile → verify no performance hit.  
5. Simulate future backend switch (config flag) → confirm all queries still resolve.  
6. Run full bundle and E2E tests.

**Reference**  
- `CLAUDE.md` §22 (Router & Data Layer Reconstruction), §4  
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` (Deliverable #6)  
- `PERFORMANCE_OPTIMIZATION_GUIDE.md` §4 (TanStack rules)  
- Master plan cross-reference: Phase 3