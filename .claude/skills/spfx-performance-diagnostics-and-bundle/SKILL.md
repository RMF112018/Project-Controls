---
name: SPFx Performance Diagnostics & Bundle Optimization
description: High-ROI bundle reduction, profiler-driven diagnostics, and verification for SPFx + Vite environments
version: 1.1
category: performance
triggers: bundle, chunk, analyze, profiler, high-roi, verify-bundle-size, top 10, usePerformanceMarker
updated: 2026-02-24
---

# SPFx Performance Diagnostics & Bundle Optimization Skill

**Activation**
Any bundle size, ANALYZE, Profiler, telemetry, or “high-ROI / Top 10” request.

**High-ROI Protocol**
1. Run `npm run build:analyze` + `npm run verify:bundle-size:fail`.
2. Prioritize heaviest libs (xlsx, jspdf, html2canvas, echarts, @xyflow/react) → dynamic imports.
3. Align to existing phase chunks (echarts, export, xstate, signalr all async).
4. Capture Profiler flamegraph + TanStack DevTools.
5. Use `usePerformanceMarker(label, { autoMeasure })` for component-level telemetry.
6. Deliver minimal diff-ready changes.
7. Re-verify with `npm run verify:sprint`.

**Phase 7 Stage 2 Additions**
- `usePerformanceMarker` hook wraps `performanceService` singleton for page/table/chart timing.
- Construction-scale benchmarks available via `MockDataService(true)` (benchmarkMode).
- Bundle hard cap: 2 MB entrypoint raw. All lazy routes use `React.lazy`.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §0–§2 and §5.