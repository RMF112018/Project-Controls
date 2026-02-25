---
name: TanStack Query & Virtualization
description: Query-key stability, default options, and virtualization threshold enforcement
version: 1.1
category: performance
triggers: query key, over-fetch, staleTime, gcTime, virtualization, 200 rows, tanstack table, MemoizedTableRow, adaptive overscan
updated: 2026-02-24
---

# TanStack Query & Virtualization Skill

**Activation**
Query behavior, key instability, over-fetching, or large-list/table discussions.

**Mandatory Patterns**
- Use queryOptions factory with primitive-only keys.
- Per-domain stale times: `QUERY_STALE_TIMES` (reference 15min, dashboard 2min, permissions 30s, buyout 20s, leads 1min).
- Per-domain gc times: `QUERY_GC_TIMES` (default 20min, infinite 5min, auditLog 3min, reference 30min).
- Infinite queries: `INFINITE_QUERY_MAX_PAGES = 50`; default `gcTime = QUERY_GC_TIMES.infinite`.
- ≥ 200 rows → `HbcTanStackTable` + `useVirtualRows` with adaptive overscan (<500→8, 500-1000→5, >1000→3).
- `MemoizedTableRow` (React.memo with custom equality on row.id + selection + data ref) — default on, opt-out via `disableRowMemoization`.
- `useTransition` for sort/filter/group; `useDeferredValue` for globalFilter.
- Optimistic mutations with rollback.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §2–§3.