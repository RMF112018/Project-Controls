# Changelog

All notable changes to HBC Project Controls will be documented in this file.

## [2026-02-24] - Phase 5D.1 - HeaderUserMenu Consolidation

### Added
- `HeaderUserMenu` component (`shared/HeaderUserMenu.tsx`) — Fluent UI v9 Menu + Persona trigger in AppShell header
- `IDevToolsConfig` interface in `App.tsx` — typed prop chain for dev tools (role switcher, mode toggle)
- `devToolsConfig` threaded through `AppContext` for header consumption
- 8 new Jest tests for HeaderUserMenu (`shared/__tests__/HeaderUserMenu.test.tsx`)
- Targeted TanStack Query invalidation on role change (`['projects','pipeline','analytics','permissions','user']`)

### Changed
- Playwright `roleFixture.ts` rewritten: native `<select>` → Fluent `MenuItemRadio` interaction
- Playwright `mode-switch.spec.ts` updated for header menu-based mode switching
- Playwright `connectors.e2e.spec.ts` removed `force: true` workarounds (z-index overlay gone)
- AppShell header: replaced static `<span>` user display with `<HeaderUserMenu>`
- `dev/index.tsx`: removed `<RoleSwitcher>`, passes `devToolsConfig` to `<App>`
- ROLE_OPTIONS (15 entries) consolidated from `dev/RoleSwitcher.tsx` into `dev/index.tsx`

### Removed
- `dev/RoleSwitcher.tsx` — floating fixed-position (z-index 9999) role switcher panel entirely deleted
- `userName` and `version` Griffel styles from AppShell (replaced by HeaderUserMenu)

## [Unreleased]

### Added
- TanStack Router v1 as sole runtime router (hash history, 58 routes including root)
- 53 lazy-loaded routes (91.4% coverage): 46 via `lazyRouteComponent`, 7 via `createLazyRoute`
- 16 named webpack chunks: 3 fat-barrel phase chunks + 13 direct-lazy page chunks
- `RouteSuspenseFallback` — skeleton loading UI with `aria-live="polite"` for all route transitions
- `RouteErrorBoundary` — error display with retry for route-level errors (`role="alert"`)
- `defaultPendingComponent` + `defaultErrorComponent` on TanStack Router for automatic boundary coverage
- `React.startTransition()` wrapping all `navigate()` calls (TanStackAdapterBridge + useTransitionNavigate)
- 8 preload hints in `/operations` loader (schedule, buyout, precon, estimating, gonogo, admin-hub, PMP, monthly review)
- `scripts/verify-lazy-coverage.js` — static source scanner enforcing lazy route coverage >= 90%
- `lazyCoverage` section in `config/bundle-budget.spfx.json` with orphan/broken-reference detection
- CI step "Verify lazy-coverage" in build job (runs before bundle build for fast failure)
- `verify:lazy-coverage` and `verify:lazy-coverage:fail` npm scripts
- `verify:sprint3` now includes lazy-coverage gate
- `docs/route-map.md` — comprehensive route table, chunk strategy, boundary layers, preload inventory, performance metrics

### Changed
- Entrypoint: 1,963,674 → 2,013,856 raw bytes (+2.6%), 466,180 → 482,769 gzip bytes (+3.6%) — within 2 MB hard cap (83 KB headroom)
- All 58 routes now have automatic Suspense + ErrorBoundary coverage (was 0)
- Navigation is concurrent via `startTransition` across all 24+ page components
