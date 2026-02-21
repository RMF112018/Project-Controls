# HBC Project Controls — Route Map

> Auto-generated from Batch 3 lazy-loading hardening. Last updated: 2026-02-20.

## Route Table

| Path | Component | Chunk | Guards | Lazy Strategy |
|---|---|---|---|---|
| `/` | DashboardPage | `page-dashboard` | none | `lazyRouteComponent` |
| `/marketing` | MarketingDashboard | `page-marketing` | MARKETING_DASHBOARD_VIEW | `lazyRouteComponent` |
| `/operations` | ActiveProjectsDashboard | `phase-operations` | ACTIVE_PROJECTS_VIEW | `lazyRouteComponent` + preloads schedule/buyout |
| `/operations/project` | ProjectDashboard | `phase-operations` | requireProject | `lazyRouteComponent` |
| `/operations/compliance-log` | ComplianceLog | `phase-operations` | COMPLIANCE_LOG_VIEW | `lazyRouteComponent` |
| `/operations/project-settings` | ProjectSettingsPage | `phase-operations` | ContractTracking + project | `lazyRouteComponent` |
| `/operations/startup-checklist` | ProjectStartupChecklist | `phase-operations` | ProjectStartup + project | `lazyRouteComponent` |
| `/operations/management-plan` | ProjectManagementPlan | `page-pmp-16-section` | PMP_EDIT + project | `lazyRouteComponent` |
| `/operations/superintendent-plan` | SuperintendentPlanPage | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/closeout-checklist` | CloseoutChecklist | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/buyout-log` | BuyoutLogPage | `page-buyout-contract` | BUYOUT_VIEW + project | **`createLazyRoute`** |
| `/operations/contract-tracking` | ContractTracking | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/risk-cost` | RiskCostManagement | `phase-operations` | RISK_EDIT + project | `lazyRouteComponent` |
| `/operations/schedule` | SchedulePage | `page-schedule` | ScheduleModule + project | **`createLazyRoute`** + preloaded |
| `/operations/quality-concerns` | QualityConcernsTracker | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/safety-concerns` | SafetyConcernsTracker | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/monthly-review` | MonthlyProjectReview | `page-monthly-review` | MonthlyProjectReview + project | **`createLazyRoute`** |
| `/operations/constraints-log` | ConstraintsLogPage | `page-constraints-permits` | CONSTRAINTS_VIEW + project | **`createLazyRoute`** |
| `/operations/permits-log` | PermitsLogPage | `page-constraints-permits` | PERMITS_VIEW + project | **`createLazyRoute`** |
| `/operations/responsibility` | ResponsibilityMatrices | `phase-operations` | ProjectStartup + project | `lazyRouteComponent` |
| `/operations/responsibility/*` | ResponsibilityMatrices | `phase-operations` | ProjectStartup + project | `lazyRouteComponent` |
| `/operations/project-record` | ProjectRecord | `page-project-record` | project | **`createLazyRoute`** |
| `/operations/lessons-learned` | LessonsLearnedPage | `phase-operations` | project | `lazyRouteComponent` |
| `/operations/gonogo` | GoNoGoScorecard | `phase-admin-hub` | project | `lazyRouteComponent` |
| `/operations/readicheck` | ComingSoonPage | inline | project | inline |
| `/operations/best-practices` | ComingSoonPage | inline | project | inline |
| `/operations/sub-scorecard` | ComingSoonPage | inline | project | inline |
| `/preconstruction` | EstimatingDashboard | `page-estimating-tracker` | EstimatingTracker | `lazyRouteComponent` |
| `/preconstruction/pipeline` | PipelinePage | `phase-preconstruction` | PipelineDashboard | `lazyRouteComponent` |
| `/preconstruction/pipeline/gonogo` | PipelinePage | `phase-preconstruction` | PipelineDashboard | `lazyRouteComponent` |
| `/preconstruction/gonogo` | PipelinePage | `phase-preconstruction` | PipelineDashboard | `lazyRouteComponent` |
| `/preconstruction/precon-tracker` | EstimatingDashboard | `page-estimating-tracker` | EstimatingTracker | `lazyRouteComponent` |
| `/preconstruction/estimate-log` | EstimatingDashboard | `page-estimating-tracker` | EstimatingTracker | `lazyRouteComponent` |
| `/preconstruction/kickoff-list` | EstimatingKickoffList | `phase-preconstruction` | KICKOFF_VIEW | `lazyRouteComponent` |
| `/preconstruction/autopsy-list` | PostBidAutopsyList | `phase-preconstruction` | LossAutopsy + AUTOPSY_VIEW | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id` | PursuitDetail | `phase-preconstruction` | pilot | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/kickoff` | EstimatingKickoffPage | `phase-preconstruction` | KICKOFF_VIEW | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/interview` | InterviewPrep | `phase-preconstruction` | pilot | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/winloss` | WinLossRecorder | `phase-preconstruction` | pilot | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/turnover` | TurnoverToOps | `phase-preconstruction` | TurnoverWorkflow | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/autopsy` | LossAutopsy | `phase-preconstruction` | LossAutopsy | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/autopsy-form` | PostBidAutopsyForm | `phase-preconstruction` | LossAutopsy + AUTOPSY_VIEW | `lazyRouteComponent` |
| `/preconstruction/pursuit/$id/deliverables` | DeliverablesTracker | `phase-preconstruction` | pilot | `lazyRouteComponent` |
| `/lead/new` | LeadFormPage | `phase-admin-hub` | LeadIntake | `lazyRouteComponent` |
| `/lead/$id` | LeadDetailPage | `phase-admin-hub` | pilot | `lazyRouteComponent` |
| `/lead/$id/gonogo` | GoNoGoScorecard | `page-gonogo` | GoNoGoScorecard | **`createLazyRoute`** |
| `/lead/$id/gonogo/detail` | GoNoGoDetail | `phase-admin-hub` | GoNoGoScorecard | `lazyRouteComponent` |
| `/lead/$id/schedule-gonogo` | GoNoGoMeetingScheduler | `phase-admin-hub` | GoNoGoScorecard | `lazyRouteComponent` |
| `/job-request` | JobNumberRequestForm | `phase-admin-hub` | pilot | `lazyRouteComponent` |
| `/job-request/$leadId` | JobNumberRequestForm | `phase-admin-hub` | pilot | `lazyRouteComponent` |
| `/accounting-queue` | AccountingQueuePage | `phase-admin-hub` | ACCOUNTING_QUEUE_VIEW | `lazyRouteComponent` |
| `/admin` | AdminPanel | `page-admin-panel` | ADMIN_CONFIG | `lazyRouteComponent` |
| `/admin/performance` | PerformanceDashboard | `phase-admin-hub` | PerformanceMonitoring + ADMIN_CONFIG | `lazyRouteComponent` |
| `/admin/application-support` | ApplicationSupportPage | `phase-admin-hub` | EnableHelpSystem + ADMIN_CONFIG | `lazyRouteComponent` |
| `/admin/telemetry` | TelemetryDashboard | `phase-admin-hub` | TelemetryDashboard + ADMIN_CONFIG | `lazyRouteComponent` |
| `/access-denied` | AccessDeniedPage | inline | none | inline |
| `/$` | NotFoundPage | inline | none | inline |

## Summary

- **Total routes**: 56 + root = 57
- **`createLazyRoute` routes**: 7 (heaviest pages by LOC)
- **Preload hints**: `/operations` loader preloads 8 high-traffic chunks (see Preload Inventory below)
- **Default preload**: `intent` (hover/focus prefetch with 30s stale time)

## Chunk Strategy

| Chunk | Contents | Strategy |
|---|---|---|
| `phase-operations` | 10 lighter ops pages | Fat barrel (`OperationsModule.tsx`) |
| `phase-preconstruction` | 11 precon pages | Fat barrel (`PreconstructionModule.tsx`) |
| `phase-admin-hub` | 10 admin/hub pages | Fat barrel (`AdminHubModule.tsx`) |
| `page-schedule` | SchedulePage | Direct lazy import |
| `page-buyout-contract` | BuyoutLogPage, ContractTracking | Direct lazy import |
| `page-constraints-permits` | ConstraintsLogPage, PermitsLogPage | Direct lazy import |
| `page-monthly-review` | MonthlyProjectReview | Direct lazy import |
| `page-gonogo` | GoNoGoScorecard (lead path) | Direct lazy import |
| `page-project-record` | ProjectRecord | Direct lazy import |
| `page-pmp-16-section` | ProjectManagementPlan | Direct lazy import |
| `page-admin-panel` | AdminPanel | Direct lazy import |
| `page-estimating-tracker` | EstimatingDashboard | Direct lazy import |
| `page-dashboard` | DashboardPage | Direct lazy import |
| `page-marketing` | MarketingDashboard | Direct lazy import |
| `page-pursuit-detail` | PursuitDetail, EstimatingKickoffPage | Vite manualChunks only |
| `page-lead-detail` | LeadDetailPage, LeadFormPage | Vite manualChunks only |

## Boundaries & Error Handling

### Boundary Layer

| Layer | Location | Catches | Component |
|---|---|---|---|
| App-level Suspense | `App.tsx` | Initial mount lazy load | `<React.Suspense>` |
| App-level ErrorBoundary | `App.tsx` | Top-level render errors | `ErrorBoundary` |
| TSR `defaultErrorComponent` | `router.tsx` | `beforeLoad`/`loader`/render errors per-route | `RouteErrorBoundary` |
| TSR `defaultPendingComponent` | `router.tsx` | Route loading (loaders, lazy chunks) | `RouteSuspenseFallback` |
| Route-level Suspense | `RootLayout` in `routes.activeProjects.tsx` | Lazy chunk loads on navigation | `<React.Suspense fallback={<RouteSuspenseFallback />}>` |
| Route-level ErrorBoundary | `RootLayout` in `routes.activeProjects.tsx` | Page component render errors | `ErrorBoundary` |

### Concurrent Navigation

`TanStackAdapterBridge` wraps all `navigate()` calls in `React.startTransition()`, making navigation from all 24+ page components concurrent. `NavigationSidebar` and `Breadcrumb` also use `startTransition` via `useTransitionNavigate` (double-wrap is safe — `startTransition` is idempotent).

### Preload Inventory

Chunks preloaded from `/operations` route loader (fire-and-forget):

| Chunk Name | Module |
|---|---|
| `page-schedule` | `SchedulePage` |
| `page-buyout-contract` | `BuyoutLogPage` |
| `phase-preconstruction` | `PreconstructionModule` |
| `page-estimating-tracker` | `EstimatingDashboard` |
| `page-gonogo` | `GoNoGoScorecard` |
| `phase-admin-hub` | `AdminHubModule` |
| `page-pmp-16-section` | `ProjectManagementPlan` |
| `page-monthly-review` | `MonthlyProjectReview` |

### Performance Verification (Post-Boundary Implementation)

| Metric | Baseline (412fb12) | Current (c76af8d) | Delta | Status |
|---|---|---|---|---|
| Entrypoint raw | 1,963,674 (~1.87 MB) | 2,013,856 (~1.92 MB) | +50,182 (+2.6%) | PASS |
| Entrypoint gzip | 466,180 (~455 KB) | 482,769 (~471 KB) | +16,589 (+3.6%) | PASS |
| Hard cap (2 MB raw) | 133 KB headroom | 83 KB headroom | -50 KB | PASS |
| Suspense coverage | 0 routes | 58 routes | +58 | Improvement |
| ErrorBoundary coverage | 0 routes | 58 routes | +58 | Improvement |
| startTransition on navigate | 0 adapters | 2 adapters (bridge + hook) | +2 | Improvement |
| Preload hints | 2 chunks | 8 chunks | +6 | Improvement |
| Lazy coverage | — | 53/58 = 91.4% | — | Baseline |
| Unit tests | 664 | 664 | 0 | — |
