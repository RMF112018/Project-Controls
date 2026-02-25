---
name: Schedule Performance Optimization
description: Extreme-scale optimization for 10k+ activity schedules under bundle and React 18 constraints
version: 1.1
category: schedule
triggers: schedule performance, 10k activities, large gantt, virtual, worker, progressive rendering
updated: 2026-02-24
---

# Schedule Performance Optimization Skill

**Activation**
Any performance discussion specific to large schedules.

**Protocol**
1. Apply `PERFORMANCE_OPTIMIZATION_GUIDE.md` §2 verbatim.
2. Virtualize all qualifying surfaces (adaptive overscan for >1000 rows).
3. Use `HbcEChart` `large` + `progressiveRender` + `sampling` for chart surfaces with 200+ data points.
4. Offload heavy work to Web Workers.
5. Use `generateScheduleActivities(1000)` from benchmark generators for testing at scale.
6. Measure with `usePerformanceMarker` + Profiler + bundle analyzer.
7. Enforce `npm run verify:sprint`.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §1 risks.