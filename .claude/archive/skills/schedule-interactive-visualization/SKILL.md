---
name: Schedule Interactive Visualization
description: Interactive ECharts Gantt, Work Plan Board, and @xyflow/react Diagrammatic Canvas
version: 1.0
category: schedule
triggers: gantt, echarts gantt, drag drop, work plan board, xyflow, swimlanes, ppc tracking
updated: 2026-02-21
---

# Schedule Interactive Visualization Skill

**Activation**  
Any Gantt, Work Plan Board, or diagrammatic canvas work.

**Enforced Patterns**  
- Lazy `HbcEChart` wrapper.  
- Drag-and-drop with optimistic TanStack Query mutations.  
- Keyboard/touch parity and high-contrast support.  
- Auto-CPM recalculation via `useTransition`.

Reference: `UX_UI_PATTERNS.md` §4.