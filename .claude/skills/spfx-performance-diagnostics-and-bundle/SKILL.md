---
name: SPFx Performance Diagnostics & Bundle Optimization
description: High-ROI bundle reduction, profiler-driven diagnostics, and verification for SPFx + Vite environments
version: 1.0
category: performance
triggers: bundle, chunk, analyze, profiler, high-roi, verify-bundle-size, top 10
updated: 2026-02-21
---

# SPFx Performance Diagnostics & Bundle Optimization Skill

**Activation**  
Any bundle size, ANALYZE, Profiler, or “high-ROI / Top 10” request.

**High-ROI Protocol**  
1. Run `npm run build:analyze` + `npm run verify:bundle-size:fail`.  
2. Prioritize heaviest libs (xlsx, jspdf, html2canvas, echarts, @xyflow/react) → dynamic imports.  
3. Align to existing phase chunks.  
4. Capture Profiler flamegraph + TanStack DevTools.  
5. Deliver minimal diff-ready changes.  
6. Re-verify with `npm run verify:sprint3`.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §0–§2 and §5.