---
name: PERFORMANCE_OPTIMIZATION_GUIDE | description: Lean performance rules and decision framework for HBC Project Controls (SPFx + React 18 + TanStack) | triggers: optimize,performance,bundle,query,render,profiler,tanstack | updated: 2026-02-21
---
# HBC PERFORMANCE OPTIMIZATION GUIDE (Lean v1)
Last updated: 2026-02-21 | Target: < 40 kB total across all agent files

## §0 Mandatory Analysis Rules (Apply to every task)
- Never suggest changes without first stating current measured state (bundle size from verify-bundle-size, query count from React Query DevTools, render count from Profiler).
- Every optimization must reference one of: TanStack Query v5, TanStack Router v1, @tanstack/react-virtual, React 18 concurrent, SPFx bundle gates, or Fluent Griffel.
- After any perf change: run `npm run verify:sprint3` (or current sprint gate) + `npm run build:standalone:report` and paste output.

## §1 Current State Snapshot (Phase 7 Stage 2 complete)
- React 18.2 + StrictMode (dev only)
- TanStack Router v1.161 (hash history, full migration complete, react-router-dom removed at runtime)
- TanStack Query v5.90 + DevTools (Wave-1 complete on hub/buyout/compliance)
- TanStack Table + Virtual (threshold ≥ 200 rows enforced) + MemoizedTableRow (React.memo with custom equality)
- React 18 concurrent features active: `useTransition` (sort/filter/group), `useDeferredValue` (globalFilter), `React.memo` (table rows)
- Fluent UI v9.46 (Griffel makeStyles + tokens)
- Bundle gates: hard fail on main, warn on PR (scripts/verify-bundle-size.js + config/bundle-budget.spfx.json)
- Data layer: 284 methods on IDataService; caching via CacheService + buildCacheKeySuffix; PnP batching; performanceService timing
- Construction-scale benchmarks: MockDataService `benchmarkMode` (Buyout 500, Audit 5000, Estimating 300, Schedule 1000, Leads 200)
- Per-domain gc times: `QUERY_GC_TIMES` (default 20min, infinite 5min, auditLog 3min, reference 30min); `INFINITE_QUERY_MAX_PAGES = 50`
- Adaptive overscan in useVirtualRows: <500→8, 500-1000→5, >1000→3
- HbcEChart: `large` (GPU acceleration), `progressiveRender` (200 points/frame), `sampling` (lttb/average/max/min)
- `usePerformanceMarker(label, {autoMeasure?})` hook for component-level telemetry (wraps PerformanceService)
- Strengths: 40+ lazy routes with Suspense, ECharts lazy chunk, SignalR → Query invalidation, PWA + offline mode
- Previous risks resolved: Context split complete (3 contexts); query-key stability established; all tables use HbcTanStackTable with memoization

## §2 Decision Framework (Always follow this order)
1. Is the surface data-driven? → Must use TanStack Query (see §3)
2. Is the list > 200 rows? → Must use HbcTanStackTable + useVirtualRows
3. Does navigation change data? → Use TanStack Router loaders + prefetching (not useEffect fetches)
4. Heavy computation / filters? → useTransition + useDeferredValue
5. Style change? → Griffel makeStyles only; never style prop on > 10 elements
6. Bundle impact? → Measure with ANALYZE=true or Vite report before/after

## §3 TanStack Query Patterns (Copy-Paste Ready)
- Always export queryOptions factory (queryOptions/{domain}.ts)
- Query key template: `["domain", siteId, projectId, filters]` (stable primitives only)
- Per-domain stale times: `QUERY_STALE_TIMES` (reference 15min, dashboard 2min, permissions 30s, buyout 20s, leads 1min)
- Per-domain gc times: `QUERY_GC_TIMES` (default 20min, infinite 5min, auditLog 3min, reference 30min)
- Infinite queries: `INFINITE_QUERY_MAX_PAGES = 50` prevents page accumulation. Default `gcTime = QUERY_GC_TIMES.infinite`
- Mutations: optimisticUpdates + rollback on error (Wave A pattern already in Buyout/PMP)
- Invalidation: useSignalRQueryInvalidation hook for real-time
- Prefetch: router loader + queryClient.prefetchQuery

## §4 React 18 & Context Rules
- Split AppContext → use separate contexts (UserContext, PermissionContext, FeatureFlagContext, ProjectContext) with useMemo selectors
- All custom hooks: wrap dataService calls in useCallback
- Heavy components: React.memo + areEqual only when props are primitives or stable objects
- Lists: useTransition for search/filter/sort
- Router adapter hooks (`useAppNavigate`, `useAppLocation`, `useAppParams`): must return memoised/ref-stable values — see `tanstack-router-stability-spfx` skill

## §5 SPFx & Bundle Rules
- Never import MSAL or heavy libs in src/ (dev/ only)
- Chunk strategy: phase-shared, phase-preconstruction, etc. (already in Vite config)
- Export heavy libs (xlsx, jspdf, html2canvas, echarts) to separate chunks
- Verify: always run `npm run verify:bundle-size:fail` before PR

## §6 Agent Instructions (Copy into every response)
When user says “optimize performance”:
1. Run mental audit using §2 framework
2. Quote exact current risk from §1
3. Provide diff-ready code using patterns from §3–§5
4. End with verification commands to run

When reviewing PR/component:
- Count uncontrolled re-renders
- Verify virtualization threshold
- Check query key stability
- Confirm bundle delta < 5 %

Reference files only. Never repeat full sections.