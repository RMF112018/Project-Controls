# Performance Governance

## Sprint 2 Baselines and Hard Gates

This project enforces hard bundle budgets in CI using `scripts/verify-bundle-size.js` and `config/bundle-budget.spfx.json`.

### Hard caps
- Initial entrypoint raw size: `<= 2 MB` (`2097152` bytes)
- Total JavaScript gzip size: `<= 4.5 MB` (`4718592` bytes)

### CI policy
- Pull requests: fail on hard cap breach (`npm run verify:bundle-size:fail`)
- Main branch: fail on hard cap breach (`npm run verify:bundle-size:fail`)
- Artifacts are uploaded for analysis:
  - `temp/analyze/spfx-bundle-report.html`
  - `temp/analyze/spfx-stats.json`
  - `temp/analyze/spfx-size-report.json`

## Baseline reset protocol

Use this only for approved performance changes:

1. `npm run bundle:ship:analyze`
2. `npm run bundle:baseline:update`
3. Commit `config/bundle-budget.spfx.json` in the same PR with perf-review sign-off.

## Sprint verification

- `npm run verify:sprint2`
- `npm run verify:bundle-size:fail`

## Optimistic Mutation rollout monitoring

During `OptimisticMutationsEnabled` pilot:
- watch mutation error rates
- watch rollback counts
- confirm no sustained route latency regressions
- disable `OptimisticMutationsEnabled` immediately if critical regression appears

## Sprint 3 Rendering Scalability

Feature flags (default OFF):
- `VirtualizedListsV1`
- `InfinitePagingEnabled`
- `InfinitePaging_AuditCompliance`
- `InfinitePaging_OpsLogs`
- `InfinitePaging_StartupRisk`

Monitoring events:
- `query.infinite.page.requested`
- `query.infinite.page.loaded`
- `query.infinite.page.failed`
- `render.virtualized.rows.visible`
- `render.virtualized.commit.duration`
- `render.virtualized.frame.drop`

Operational targets:
- page fetch p95 `< 800ms` (pilot cohorts)
- frame-drop rate `< 5%`
- hard bundle caps remain green in CI
