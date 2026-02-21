---
name: TanStack Query & Virtualization
description: Query-key stability, default options, and virtualization threshold enforcement
version: 1.0
category: performance
triggers: query key, over-fetch, staleTime, gcTime, virtualization, 200 rows, tanstack table
updated: 2026-02-21
---

# TanStack Query & Virtualization Skill

**Activation**  
Query behavior, key instability, over-fetching, or large-list/table discussions.

**Mandatory Patterns**  
- Use queryOptions factory with primitive-only keys.  
- Defaults: `staleTime: 30s`, `gcTime: 5min`.  
- ≥ 200 rows → `HbcTanStackTable` + `useVirtualRows`.  
- Optimistic mutations with rollback.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §2–§3.