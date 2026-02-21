# Integration & UX Polish: React 18 Concurrent Features + Fluent UI v9 Error Handling

## Context

After Batch 3 (commit c76af8d), the router has 57 routes (7 `createLazyRoute`, rest `lazyRouteComponent`) but **no loading or error UX** for route navigations:

**Current measured state** (per PERFORMANCE_OPTIMIZATION_GUIDE §0):
- The single `<React.Suspense>` in `App.tsx` wraps `RouterProvider` — fires only on initial mount, NOT on subsequent navigations
- `<Outlet />` in `RootLayout` (routes.activeProjects.tsx:73) has no `<Suspense>` — navigating to a lazy route shows **blank content** until the chunk loads
- No `defaultPendingComponent` or `defaultErrorComponent` on `createRouter()` (router.tsx:18-32)
- `TanStackAdapterBridge` navigate (routes.activeProjects.tsx:54) does NOT wrap in `startTransition` — only 2 of 26+ navigation consumers use concurrent transitions (NavigationSidebar, Breadcrumb via `useTransitionNavigate`)
- Only 2 preload hints exist (schedule + buyout from `/operations` loader)

**Applicable Skills**: `react-context-and-concurrent` (startTransition protocol), `spfx-performance-diagnostics-and-bundle` (preload/bundle impact verification)

**Goal:** Wire Suspense boundaries, error boundaries, concurrent navigation, and preload hints into the router infrastructure — without touching any route definition files or lazy component files.

---

## Files Modified (3)

| File | Changes |
|---|---|
| `tanstack/router/router.tsx` | Add `defaultPendingComponent` + `defaultErrorComponent` to `createRouter()` |
| `tanstack/router/routes.activeProjects.tsx` | Wrap `<Outlet>` in `<ErrorBoundary><Suspense>`, wrap adapter `navigate` in `startTransition`, add 6 preload imports |
| `docs/route-map.md` | Append Boundaries & Preloading section |

## Files Created (5)

| File | Purpose |
|---|---|
| `components/boundaries/RouteSuspenseFallback.tsx` | Skeleton fallback for `<Suspense>` around `<Outlet>` |
| `components/boundaries/RouteErrorBoundary.tsx` | Fluent v9 error card for TanStack Router's `defaultErrorComponent` |
| `components/boundaries/index.ts` | Barrel export (per CODE_ARCHITECTURE_GUIDE §2) |
| `components/boundaries/__tests__/RouteSuspenseFallback.test.tsx` | Tests |
| `components/boundaries/__tests__/RouteErrorBoundary.test.tsx` | Tests |

---

## Step 1: Create `components/boundaries/RouteSuspenseFallback.tsx`

Lightweight skeleton fallback shown during lazy chunk loading on navigation. Reuses existing `HbcSkeleton` component (per UX_UI_PATTERNS §3: "Loading state with Fluent Skeleton or Spinner").

```tsx
import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HbcSkeleton } from '../shared/HbcSkeleton';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
    ...shorthands.gap(tokens.spacingVerticalM),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
});

export const RouteSuspenseFallback: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.container} aria-live="polite" aria-busy="true" aria-label="Loading page">
      <HbcSkeleton variant="kpi-grid" columns={3} />
      <HbcSkeleton variant="table" rows={4} columns={4} />
    </div>
  );
};
```

**Design rationale:**
- `kpi-grid` + `table` approximates most route layouts (KPI cards above data table)
- Griffel `makeStyles` + Fluent tokens only (UX_UI_PATTERNS §2)
- `aria-live="polite"` + `aria-busy="true"` + `aria-label` for screen readers (UX_UI_PATTERNS §3)
- HbcSkeleton already handles `prefers-reduced-motion` via `useHbcMotionStyles`

---

## Step 2: Create `components/boundaries/RouteErrorBoundary.tsx`

TanStack Router's `defaultErrorComponent` receives `ErrorComponentProps` (`{ error, info?, reset }`). Uses Fluent v9 tokens and raw `Button`.

```tsx
import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { ErrorComponentProps } from '@tanstack/react-router';

const useStyles = makeStyles({
  root: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.border('1px', 'solid', tokens.colorStatusDangerBorderActive),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorStatusDangerBackground1,
    maxWidth: '640px',
    ...shorthands.margin(tokens.spacingVerticalXL, 'auto'),
  },
  heading: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    margin: '0',
    marginBottom: tokens.spacingVerticalS,
  },
  message: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    marginBottom: tokens.spacingVerticalM,
  },
  details: {
    marginTop: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  stack: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  actions: { marginTop: tokens.spacingVerticalM },
});

export const RouteErrorBoundary: React.FC<ErrorComponentProps> = ({ error, info, reset }) => {
  const styles = useStyles();
  return (
    <div role="alert" className={styles.root}>
      <h2 className={styles.heading}>Something went wrong</h2>
      <p className={styles.message}>
        {error instanceof Error ? error.message : 'An unexpected error occurred.'}
      </p>
      {info?.componentStack ? (
        <details className={styles.details}>
          <summary>Technical details</summary>
          <pre className={styles.stack}>{info.componentStack}</pre>
        </details>
      ) : null}
      <div className={styles.actions}>
        <Button appearance="primary" aria-label="Try loading the page again" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
};
```

**Design decisions:**
- Uses raw Fluent `Button` (not `HbcButton`) — avoids dependency on `useAppContext`; keeps error boundary safe even if context providers fail
- 100% Griffel `makeStyles` + Fluent semantic tokens (UX_UI_PATTERNS §2) — no inline styles, no `HBC_COLORS`
- `error instanceof Error` guard handles thrown strings/objects from third-party code
- `reset()` calls TSR's internal `CatchBoundary.reset()` — re-runs route match without page reload
- Collapsible `<details>` for component stack avoids cluttering the default view
- `role="alert"` for WCAG 2.2 AA (UX_UI_PATTERNS §3)
- Keyboard accessible: `<details>/<summary>` natively keyboard-operable, `Button` natively focusable

---

## Step 3: Create `components/boundaries/index.ts`

Barrel export per CODE_ARCHITECTURE_GUIDE §2.

```ts
export { RouteSuspenseFallback } from './RouteSuspenseFallback';
export { RouteErrorBoundary } from './RouteErrorBoundary';
```

---

## Step 4: Modify `tanstack/router/router.tsx`

Wire `defaultPendingComponent` and `defaultErrorComponent` into `createRouter()` (per PERFORMANCE_OPTIMIZATION_GUIDE §2: "navigation changes data → Router loaders + prefetching").

**Add imports:**
```tsx
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
import { RouteErrorBoundary } from '../../components/boundaries/RouteErrorBoundary';
```

**Add to `createRouter()` options (after `defaultPreloadStaleTime: 30_000,`):**
```tsx
defaultPendingComponent: RouteSuspenseFallback,
defaultErrorComponent: RouteErrorBoundary,
```

Both are stable component references — no impact on `useMemo` memoization.

- `defaultPendingComponent` shows during route loading (loaders, lazy chunks) via TSR's built-in pending mechanism
- `defaultErrorComponent` catches errors thrown in `beforeLoad`, `loader`, or component render at the route level

---

## Step 5: Modify `tanstack/router/routes.activeProjects.tsx`

Three changes. None touch route definitions or `tanStackPilotRouteTree`.

### 5a: Add imports (top of file)

```tsx
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
```

### 5b: Wrap `<Outlet />` in `RootLayout` (lines 69-81)

**Before:**
```tsx
const RootLayout: React.FC = () => (
  <TanStackAdapterBridge>
    <TelemetryPageTracker />
    <AppShell>
      <Outlet />
    </AppShell>
    {/* devtools */}
  </TanStackAdapterBridge>
);
```

**After:**
```tsx
const RootLayout: React.FC = () => (
  <TanStackAdapterBridge>
    <TelemetryPageTracker />
    <AppShell>
      <ErrorBoundary>
        <React.Suspense fallback={<RouteSuspenseFallback />}>
          <Outlet />
        </React.Suspense>
      </ErrorBoundary>
    </AppShell>
    {/* devtools unchanged */}
  </TanStackAdapterBridge>
);
```

**Why both:** `<Suspense>` catches lazy chunk loading on navigation (main gap). `ErrorBoundary` catches render errors that slip past TSR's `CatchBoundary`. `ErrorBoundary` wraps `Suspense` so even fallback errors are caught. `AppShell` stays outside so chrome (header, sidebar) remains visible during loading.

### 5c: Wrap `navigate` in `startTransition` in `TanStackAdapterBridge` (line 54)

Per `react-context-and-concurrent` Skill protocol step 3: "Wrap non-urgent updates in `startTransition`."

**Before:**
```tsx
void navigate({ to, replace: options?.replace });
```

**After:**
```tsx
React.startTransition(() => {
  void navigate({ to, replace: options?.replace });
});
```

This makes ALL 24+ page component navigation calls concurrent (they all flow through this single adapter seam). `NavigationSidebar` and `Breadcrumb` already wrap in `startTransition` via `useTransitionNavigate` — double-wrap is safe (`startTransition` is idempotent/re-entrant).

### 5d: Add 6 preload imports in `operationsRoute.loader` (lines 99-106)

Per PERFORMANCE_OPTIMIZATION_GUIDE §2: "navigation changes data → Router loaders + prefetching."

**Before (2 preloads):**
```tsx
loader: ({ context }) => {
  import(/* webpackChunkName: "page-schedule" */ '../../components/pages/project/SchedulePage').catch(() => {});
  import(/* webpackChunkName: "page-buyout-contract" */ '../../components/pages/project/BuyoutLogPage').catch(() => {});
  return context.queryClient.ensureQueryData(
    activeProjectsListOptions(context.scope, context.dataService, {})
  );
},
```

**After (8 preloads):**
```tsx
loader: ({ context }) => {
  // Fire-and-forget preloads for high-traffic chunks
  import(/* webpackChunkName: "page-schedule" */ '../../components/pages/project/SchedulePage').catch(() => {});
  import(/* webpackChunkName: "page-buyout-contract" */ '../../components/pages/project/BuyoutLogPage').catch(() => {});
  import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule').catch(() => {});
  import(/* webpackChunkName: "page-estimating-tracker" */ '../../components/pages/precon/EstimatingDashboard').catch(() => {});
  import(/* webpackChunkName: "page-gonogo" */ '../../components/pages/hub/GoNoGoScorecard').catch(() => {});
  import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule').catch(() => {});
  import(/* webpackChunkName: "page-pmp-16-section" */ '../../components/pages/project/pmp/ProjectManagementPlan').catch(() => {});
  import(/* webpackChunkName: "page-monthly-review" */ '../../components/pages/project/MonthlyProjectReview').catch(() => {});
  return context.queryClient.ensureQueryData(
    activeProjectsListOptions(context.scope, context.dataService, {})
  );
},
```

These fire on `/operations` dashboard load. They warm the browser module cache — idempotent with lazy route imports (same `webpackChunkName` = same chunk). Zero bundle-size impact (no new code added to any chunk).

---

## Step 6: Create Tests

Per TESTING_STRATEGY §0 (Unit 70% + a11y 100% of new surfaces) and §1 (RTL user-event, screen queries only).

### `components/boundaries/__tests__/RouteSuspenseFallback.test.tsx`

- Verify `aria-live="polite"` and `aria-busy="true"` attributes via `screen.getByRole('status')`
- Verify `aria-label` contains "Loading page"
- Verify skeleton content renders (2 HbcSkeleton instances)

### `components/boundaries/__tests__/RouteErrorBoundary.test.tsx`

- Verify error message renders from `Error` instance via `screen.getByText()`
- Verify `role="alert"` on root via `screen.getByRole('alert')`
- Verify `reset` is called on "Try Again" click via `userEvent.click()`
- Verify technical details shown when `info.componentStack` provided
- Verify technical details hidden when `info` absent
- Verify graceful handling of non-`Error` error objects (string thrown) — shows fallback message

---

## Step 7: Update `docs/route-map.md`

Append a section documenting the boundary layer and preload inventory.

**Boundary Layer Table** — 6 layers:
1. App-level Suspense (App.tsx — initial mount)
2. App-level ErrorBoundary (App.tsx — catches everything)
3. TSR `defaultErrorComponent` (per-route — catches `beforeLoad`/`loader`/render errors)
4. TSR `defaultPendingComponent` (per-route — shows during route loading)
5. Route-level Suspense in RootLayout (catches lazy chunk loads on navigation)
6. Route-level ErrorBoundary in RootLayout (catches page render errors)

**Concurrent Navigation** — `TanStackAdapterBridge` wraps all `navigate()` in `startTransition`

**Preload Inventory** — 8 chunks preloaded from `/operations` loader

---

## Boundary Architecture (Visual)

```
FluentProvider
  ErrorBoundary (App.tsx — catches everything)
    QueryClientProvider
      AppProvider / SignalR / Help / Toast
        React.Suspense (App.tsx — initial mount only)
          RouterProvider
            RootLayout
              AppShell (chrome stays visible)
                ErrorBoundary (RootLayout — catches render errors)  <-- NEW
                  React.Suspense (RootLayout — catches lazy loads)  <-- NEW
                    <Outlet /> (route component)
                      TSR CatchBoundary (defaultErrorComponent)    <-- NEW
                      TSR PendingComponent (defaultPendingComponent) <-- NEW
```

---

## Verification (per CLAUDE.md §0 workflow rules)

1. `volta run --node 22.14.0 npx tsc --noEmit` — zero errors
2. `volta run --node 22.14.0 npx eslint src/webparts/hbcProjectControls/components/boundaries/ src/webparts/hbcProjectControls/tanstack/router/router.tsx src/webparts/hbcProjectControls/tanstack/router/routes.activeProjects.tsx --ext .ts,.tsx` — zero warnings
3. `volta run --node 22.14.0 npx jest --selectProjects components -- boundaries` — new tests pass
4. `volta run --node 22.14.0 npx jest` — all 654+ tests pass
5. `npm run test:a11y` — zero violations (TESTING_STRATEGY §0: a11y 100% of new surfaces)
6. `npm run verify:sprint3` — sprint gate passes (CLAUDE.md §0)
7. `npm run verify:bundle-size:fail` — no budget regressions (`spfx-performance-diagnostics-and-bundle` protocol step 6)
8. `npm run dev` — manual smoke: navigate between routes, verify skeleton shows during chunk load, verify error boundary renders on simulated error
