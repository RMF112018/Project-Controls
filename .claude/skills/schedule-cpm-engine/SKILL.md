---
name: Schedule CPM Engine
description: Core CPM calculation engine with forward/backward pass, float recalculation, and WASM option
version: 1.0
category: schedule
triggers: cpm, scheduleengine, forward pass, backward pass, float, critical path, wasm
updated: 2026-02-21
---

# Schedule CPM Engine Skill

**Activation**  
CPM logic, recalculation, or performance-critical schedule computation.

**Protocol**  
1. Implement `ScheduleEngine.ts` with deterministic passes.  
2. Optional WASM path for 10k+ activities.  
3. Expose via TanStack Query mutation with `useTransition`.  
4. Unit test with fake timers.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md`.