---
name: FEATURE_DEVELOPMENT_BLUEPRINT | description: Blueprint for implementing new features, domains, and schedule-v2 replacements in HBC Project Controls | triggers: feature,new,domain,schedule,blueprint,development,route | updated: 2026-02-21
---
# HBC FEATURE DEVELOPMENT BLUEPRINT
For adding new domains, pages, or schedule-v2 replacement

## §0 Phase Gate (Before any code)
1. Update CLAUDE.md §7 & §15
2. Define in IDataService first (or extend)
3. Add queryOptions + guard (tanstack/router/guards/)
4. Add route module under tanstack/router/routes.{domain}.tsx
5. Storybook + a11y + E2E parity required

## §1 New Domain Checklist
- [ ] Model + columnMappings in @hbc/sp-services
- [ ] IDataService method (Mock + SharePoint impl)
- [ ] TanStack Query factory + hook
- [ ] Route with loader + guard chain
- [ ] HbcTanStackTable if list > 50 rows
- [ ] Feature flag + permission template
- [ ] Audit log entry
- [ ] verify:sprint3 passes

## §2 Schedule-v2 Replacement Guidance (Post-revert)
- Use TanStack Virtual + custom Gantt row renderer (not full library)
- Or @tanstack/react-table with column grouping + virtual
- Data: new queryOptions/schedule.ts with cursor paging
- Optimistic updates for drag-drop (Wave A pattern)
- Bundle impact: keep under current gate

## §3 Agent Prompt Template (Use verbatim)
“Implement [feature] following HBC patterns. 
1. Update data layer first. 
2. Use TanStack Router loader + Query. 
3. Apply PERFORMANCE_OPTIMIZATION_GUIDE §2. 
4. Verify with sprint gate. 
Show diff and commands to run.”

Keep under 10 kB. Archive old sections to CLAUDE_ARCHIVE.md when > 35 kB.