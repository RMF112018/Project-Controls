# Prompt 6 Performance Benchmarks

## Method
- Baseline bundle footprint captured from existing `storybook-static` output before Prompt 6 final build.
- Post-change bundle footprint captured after Prompt 6 final `npm run build-storybook`.
- Perceived load metrics captured from `performanceService` marks exposed by `AppContext` (`window.__hbcPerformanceMarks__`) using a one-off Playwright probe in mock mode.

## Bundle Footprint (Storybook Static Output)
- Baseline (pre-Prompt 6 final build): `16476 KB`
- Post-Prompt 6 final build: `17264 KB`
- Delta: `+788 KB` (`+4.78%`)

## Perceived Load (performanceService Marks)
Captured route samples:
- `/#/preconstruction`
- `/#/operations`

Observed marks:
- `app:userFlagsFetch`: `54 ms`
- `app:permissionResolve`: `53 ms`
- `app:contextInit`: `107 ms`

Notes:
- Both sampled routes reported identical context-init marks in mock mode, as expected (shared app bootstrap path).
- Route-specific dashboard fetch marks are instrumented (`estimating:dashboardDataFetch`, `operations:dashboardDataFetch`) and available for expanded telemetry capture in CI/perf runs.

## Interpretation
- Prompt 6 enhancements remain within acceptable perceived-load thresholds in mock mode (`app:contextInit` near `~107 ms`).
- Bundle growth is modest and consistent with additive UX capabilities (Insights panel, motion and toast enhancements, additional stories).
