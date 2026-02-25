# Feature Flag Registry

> Canonical registry of all feature flags in HBC Project Controls.
> Maintained as part of Phase 7 Stage 5 (Feature Flag Debt Cleanup).

## Phase 7S5 Wave 2 Changes (2026-02-25)

**Removed (4 dead flags):**
- `TanStackRouterEnabled` (old id 35) -- TanStack Router is sole runtime router since Phase 3; flag was dead code
- `InfinitePaging_AuditCompliance` (old id 45) -- zero code references outside featureFlags.json
- `InfinitePaging_OpsLogs` (old id 46) -- zero code references outside featureFlags.json
- `InfinitePaging_StartupRisk` (old id 47) -- zero code references outside featureFlags.json

**Enabled for production (2 flags):**
- `VirtualizedListsV1` (id 42) -- role restriction removed, enabled globally (Phase 7S2 hardening complete)
- `GraphBatchingEnabled` (id 54) -- enabled globally (Phases 5D, 7S3, 7S4 hardening complete)

**Total: 56 flags (60 original - 4 removed)**

## Flag Registry Table

| ID | FeatureName | DisplayName | Enabled | Status | Lifecycle Notes |
|----|-------------|-------------|---------|--------|-----------------|
| 1 | LeadIntake | Lead Intake | true | active-on | Core feature -- always on |
| 2 | GoNoGoScorecard | Go/No-Go Scorecard | true | active-on | Core feature |
| 3 | AutoSiteProvisioning | Automatic Site Provisioning | true | active-on | Core infrastructure |
| 4 | MeetingScheduler | Meeting Scheduler | true | active-on | Preconstruction feature |
| 5 | PipelineDashboard | Pipeline Dashboard | true | active-on | Core feature |
| 6 | TurnoverWorkflow | Turnover Workflow | true | active-on | Project execution feature |
| 7 | LossAutopsy | Post-Bid Loss Autopsy | true | active-on | Preconstruction feature |
| 8 | EstimatingTracker | Estimating Tracker | true | active-on | Core feature |
| 9 | UnanetIntegration | Unanet ERP Integration | false | active-off (target date pending) | Phase 2 -- target 2026-06-01 |
| 10 | SageIntegration | Sage 300 Integration | false | active-off (target date pending) | Phase 2 -- target 2026-06-01 |
| 11 | DocumentCrunchIntegration | Document Crunch AI Review | false | active-off (target date pending) | AI contract review -- target 2026-09-01 |
| 12 | EstimatingModule | Full Estimating Module | false | active-off (target date pending) | Full estimating module -- target 2026-12-01 |
| 13 | BudgetSync | Budget Sync | false | active-off (target date pending) | Budget sync with accounting |
| 14 | ExecutiveDashboard | Executive Dashboard | true | active-on | Phase 8 exec dashboard |
| 15 | DualNotifications | Dual Notifications (Email + Teams) | false | active-off | Deferred infrastructure |
| 16 | AuditTrail | Audit Trail | false | active-off | Detailed audit trail logging |
| 17 | OfflineSupport | Offline Support | false | active-off | Offline mode with queue sync -- Gen 2/3 |
| 18 | ProjectStartup | Project Startup | true | active-on | Phase 9 startup checklist |
| 19 | MarketingProjectRecord | Marketing Project Record | true | active-on | Phase 9 marketing |
| 20 | ProjectManagementPlan | Project Management Plan | true | active-on | Phase 10 PMP |
| 21 | MonthlyProjectReview | Monthly Project Review | true | active-on | Phase 10 monthly review |
| 22 | WorkflowDefinitions | Workflow Definitions | true | active-on | Phase 13 workflow config |
| 23 | PermissionEngine | Permission Engine | true | active-on | Phase 19 Procore-modeled RBAC |
| 24 | PerformanceMonitoring | Performance Monitoring | true | active-on | Web part perf dashboard |
| 25 | EnableHelpSystem | Help & Support System | true | active-on | Contextual help + guided tours |
| 26 | ProvisioningRealOps | Real Site Provisioning Operations | false | active-off | Real PnP.js ops (simulation when OFF) |
| 27 | ContractTracking | Contract Tracking Workflow | true | active-on | 4-step subcontract approval |
| 28 | ContractTrackingDevPreview | Contract Tracking Dev Preview | true | active-on | Dev-mode next-approver preview |
| 29 | DevUserManagement | Dev User Management | true | active-on | Admin mock user role editor |
| 30 | ScheduleModule | P6 Schedule Management | true | active-on | Primavera P6-style schedule |
| 31 | ConstraintsLog | Constraints Log | true | active-on | Dashboard charts + detail modal |
| 32 | TelemetryDashboard | Telemetry Dashboard | true | active-on | Admin-only (ExecutiveLeadership, SharePointAdmin) |
| 33 | GitOpsProvisioning | GitOps Template Provisioning | false | active-off | Step 5 template from /templates/ dir |
| 34 | TemplateSiteSync | Template Site Sync Panel | false | active-off | Admin Provisioning tab sync UI |
| 35 | LazyHeavyLibsV1 | Lazy Heavy Libraries V1 | true | active-on | Deferred ECharts + export libs |
| 36 | PhaseChunkingV1 | Phase Chunking V1 | true | active-on | Phase-based chunk boundaries |
| 37 | OptimisticMutationsEnabled | Optimistic Mutations Enabled | false | active-off (phased rollout planned) | Global gate for optimistic mutations |
| 38 | OptimisticMutations_Leads | Optimistic Mutations Leads | false | active-off (phased rollout planned) | Domain-scoped: Leads |
| 39 | OptimisticMutations_Estimating | Optimistic Mutations Estimating | false | active-off (phased rollout planned) | Domain-scoped: Estimating |
| 40 | OptimisticMutations_Buyout | Optimistic Mutations Buyout | false | active-off (phased rollout planned) | Domain-scoped: Buyout |
| 41 | OptimisticMutations_PMP | Optimistic Mutations PMP | false | active-off (phased rollout planned) | Domain-scoped: PMP |
| 42 | VirtualizedListsV1 | Virtualized Lists V1 | true | active-on | Virtualization hardening -- production-ready (Phase 7S2). Enabled globally in Phase 7S5. |
| 43 | InfinitePagingEnabled | Infinite Paging Enabled | false | active-off | Global gate for cursor-based infinite query paging |
| 44 | uxDelightMotionV1 | UX Delight Motion v1 | true | active-on | Motion polish and transitions |
| 45 | uxPersonalizedDashboardsV1 | UX Personalized Dashboards v1 | true | active-on | Per-user dashboard preferences |
| 46 | uxChartTableSyncGlowV1 | UX Chart-Table Sync Glow v1 | true | active-on | Synchronized chart/table highlights |
| 47 | uxInsightsPanelV1 | UX Insights Panel v1 | true | active-on | Contextual insights panel |
| 48 | uxToastEnhancementsV1 | UX Toast Enhancements v1 | true | active-on | Undo/progress/action toasts |
| 49 | SiteProvisioningWizard | Site Provisioning Wizard | true | active-on | Phase 1: Wizard + Entra ID sync |
| 50 | RoleConfigurationEngine | Role Configuration Engine | true | active-on | Phase 2: Config-driven RBAC |
| 51 | ConnectorMutationResilience | Connector Mutation Resilience | false | active-off | Phase 5A: Retry/backoff for connector mutations |
| 52 | WorkflowStateMachine | Workflow State Machine | false | active-off (dual-path by design) | Phase 5B: xstate-backed transitions. Legacy path active when OFF. |
| 53 | ProvisioningSaga | Provisioning Saga | false | active-off (dual-path by design) | Phase 5C: Saga-style reverse compensation. Legacy path active when OFF. |
| 54 | GraphBatchingEnabled | Graph Batch Enforcer | true | active-on | Auto-batches Graph API calls (10ms coalescence). Production-ready (Phases 5D, 7S3, 7S4). Enabled in Phase 7S5. |
| 55 | uxSuiteNavigationV1 | Suite Navigation V1 | true | active-on | Phase 3: AppLauncher + ContextualSidebar |
| 56 | SiteTemplateManagement | Site Template Management | true | active-on | Phase 6A: Template CRUD + GitOps sync (Executive Leadership, SharePoint Admin) |

## Removed Flags (dead-removed)

| Old ID | FeatureName | Removal Reason | Removed In |
|--------|-------------|----------------|------------|
| 35 | TanStackRouterEnabled | TanStack Router is sole runtime router since Phase 3 -- flag was dead code | Phase 7S5 Wave 2 |
| 45 | InfinitePaging_AuditCompliance | Zero code references outside featureFlags.json | Phase 7S5 Wave 2 |
| 46 | InfinitePaging_OpsLogs | Zero code references outside featureFlags.json | Phase 7S5 Wave 2 |
| 47 | InfinitePaging_StartupRisk | Zero code references outside featureFlags.json | Phase 7S5 Wave 2 |

## Flag Lifecycle Statuses

| Status | Description |
|--------|-------------|
| `active-on` | Flag enabled in production, feature fully available |
| `active-off` | Flag exists and is intentionally disabled (awaiting rollout, integration, or phased enablement) |
| `active-off (dual-path by design)` | Flag controls dual-path behavior; legacy path remains active when OFF by design |
| `active-off (phased rollout planned)` | Flag disabled pending phased domain-by-domain rollout |
| `active-off (target date pending)` | Flag disabled, integration work scheduled for future date |
| `deprecated` | Flag scheduled for removal in upcoming phase |
| `dead-removed` | Flag removed from registry (no code references) |
