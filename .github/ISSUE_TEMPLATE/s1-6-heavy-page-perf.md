---
name: S1.6 Heavy Page Performance
about: Add lazy route loading and transition navigation for Admin Panel, Estimating Tracker, PMP
title: "[Sprint 1] S1.6 Heavy-page lazy loading + transition nav"
labels: ["sprint-1", "performance", "code-splitting"]
assignees: []
---

## Scope
- Add lazy route components for:
  - Admin Panel (9 tabs)
  - Estimating Tracker
  - PMP (16 sections)
- Add non-blocking navigation using `React.startTransition`
- Verify standalone `manualChunks`

## Acceptance Criteria
- [ ] Heavy pages are split into dedicated chunks
- [ ] Navigation remains responsive under load
- [ ] Informational bundle report updated
