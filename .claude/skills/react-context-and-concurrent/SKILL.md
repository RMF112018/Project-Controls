---
name: React Context & Concurrent Optimization
description: Elimination of cascade re-renders via context splitting and strategic use of React 18 concurrent features
version: 1.0
category: performance
triggers: context, appcontext, re-render, cascade, useTransition, useDeferredValue, concurrent
updated: 2026-02-21
---

# React Context & Concurrent Optimization Skill

**Activation**  
Excessive re-renders, AppContext, or heavy filter/search/sort discussions.

**Protocol**  
1. Profile with React DevTools.  
2. Split AppContext into domain-specific contexts + useMemo selectors.  
3. Wrap non-urgent updates in `startTransition` / `useDeferredValue`.  
4. Apply `React.memo` + custom `areEqual` on heavy components.  
5. Re-profile to confirm improvement.

Reference: `PERFORMANCE_OPTIMIZATION_GUIDE.md` §4.