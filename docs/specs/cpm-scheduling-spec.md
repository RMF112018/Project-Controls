# CPM Scheduling Specification
**Live at commit:** 83db2ad9e8b0b8f164562564dbff4fad554d4e8b

## Purpose
Authoritative rules for Critical Path Method calculations in HBC projects.

## Key Entities & File Paths at this commit
- Types: `packages/hbc-sp-services/src/models/ISchedule.ts`
- Service: `packages/hbc-sp-services/src/services/schedulingService.ts`
- Component: `src/webparts/hbcProjectControls/components/scheduling/GanttView.tsx`

## Business Rules & Invariants
- Total Float ≥ 0; negative float forbidden.
- Calendar must respect Florida holiday set.
- What-if scenarios use immutable copy of baseline.

## Correctness Criteria
- Critical path recalculation within 500 ms on tablet.

## Failure Modes & Prevention
- Calendar mismatch → use construction-domain-specialist.

Agent instruction: Paste this spec into any scheduling task.