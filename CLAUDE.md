# CLAUDE.md — HBC Project Controls Blueprint

╔══════════════════════════════════════════════════════════════════════╗
║  MANDATORY: UPDATE THIS FILE AFTER EVERY CODE CHANGE               ║
║                                                                      ║
║  This file is the primary reference for all AI-assisted development. ║
║  After completing ANY task that modifies the codebase, you MUST      ║
║  update every affected section of this document before concluding    ║
║  your work. This includes but is not limited to:                     ║
║                                                                      ║
║  - New/modified/deleted files → update Directory Structure (§2)      ║
║  - New/modified interfaces → update Data Models (§6)                 ║
║  - New/modified service methods → update Service Methods (§7)        ║
║  - New/modified routes → update Routes (§8)                          ║
║  - New/modified nav items → update Navigation Sidebar (§9)           ║
║  - New/modified permissions → update RBAC Matrix (§10)               ║
║  - New/modified feature flags → update Feature Flags (§11)           ║
║  - New/modified mock data → update Mock Data Files (§12)             ║
║  - New/modified constants → update Key Constants (§13)               ║
║  - New/modified shared components → update Shared Components (§5)    ║
║  - Phase completion → update Current Phase Status (§15)              ║
║  - New build pitfalls discovered → update Common Pitfalls (§16)      ║
║                                                                      ║
║  If you are unsure whether a section needs updating, update it.      ║
║  Stale documentation is worse than no documentation.                 ║
╚══════════════════════════════════════════════════════════════════════╝

<<<<<<< extract-common-services
**Last Updated:** 2026-02-14 — Fix `@hbc/sp-services` import resolution (workspace symlink, lib build, SPFx alias)
=======
**Last Updated:** 2026-02-14 — GitHub Actions CI/CD Pipeline
>>>>>>> main

---

## §1 Tech Stack & Build

| Item | Value |
|------|-------|
| Framework | SharePoint Framework (SPFx) 1.21.1 |
| UI Library | React 18.2.0 |
| TypeScript | ~5.3.3 |
| Component Library | @fluentui/react-components ^9.46.0, @fluentui/react-icons ^2.0.230 |
| Styling | Griffel makeStyles (Fluent UI v9 CSS-in-JS) + Fluent tokens, minimal inline for dynamic values |
| Router | react-router-dom ^6.22.3 |
| SP Data | @pnp/sp ^4.4.1, @pnp/graph ^4.4.1 |
| Charts | recharts ^2.12.3 |
| Export | jspdf ^2.5.2, html2canvas ^1.4.1, xlsx ^0.18.5 |
| Build Tool | gulp ^4.0.2, webpack ^5.90.0 |
| Test | jest ^29.7.0, @testing-library/react ^14.0.0 |
| Lint | eslint ^8.57.0, @microsoft/eslint-config-spfx 1.21.1 |
| Node (Volta) | 22.14.0 |
| Code Splitting | React.lazy() + Suspense — 40 page components lazy-loaded, shell in main bundle |
| Monorepo | npm workspaces — `packages/hbc-sp-services` (data layer) consumed by app |
| Node (engines) | >=18.17.1 <19.0.0 |

### Build Commands

```
gulp serve --nobrowser          # SPFx local workbench
gulp bundle --ship              # Production bundle
gulp package-solution --ship    # Create .sppkg
npm run dev                     # Standalone dev server (port 3000)
npm run build:lib               # Build @hbc/sp-services library only
npm run build:app               # SPFx bundle --ship + package-solution --ship
npm run build                   # build:lib then build:app (full pipeline)
npm run test                    # Jest tests
npm run lint                    # ESLint
```

**Important:** Prefix gulp commands with `volta run --node 22.14.0` when needed.

### CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| CI (`ci.yml`) | Push to main, PRs | npm ci → tsc --noEmit → lint → gulp bundle --ship → gulp package-solution --ship → upload .sppkg artifact |
| Release (`release.yml`) | Tag `v*` | Full build → GitHub Release with .sppkg asset |
| PR Validation (`pr-validation.yml`) | PRs only | npm ci → tsc --noEmit → lint (fast feedback) |
| Dependabot (`dependabot.yml`) | Weekly (Monday) | npm + GitHub Actions updates, SPFx packages ignored for major/minor |

### Key Config Files

| File | Purpose |
|------|---------|
| config/package-solution.json | Solution ID, Graph permissions, skip feature deployment |
| config/serve.json | Port 4321, HTTPS, initial workbench page |
| config/config.json | Bundle entry: ./lib/webparts/hbcProjectControls/HbcProjectControlsWebPart.js |
| tsconfig.json | Target es2017, module esnext, jsx react-jsx, path aliases (@components/*, @services/*, etc.) |
| gulpfile.js | SPFx build, suppresses SASS non-camelCase warning, @hbc/sp-services webpack alias |
| .npmrc | legacy-peer-deps=true (SPFx + React 18 peer dep conflicts) |
| dev/webpack.config.js | Dev server port 3000, REACT_APP_USE_MOCK=true |
| dev/tsconfig.json | Extends root tsconfig, includes dev/**/* |

### TSConfig Path Aliases

| Alias | Target |
|-------|--------|
| @webparts/* | src/webparts/* |
| @components/* | src/webparts/hbcProjectControls/components/* |
| @hooks/* | src/webparts/hbcProjectControls/components/hooks/* |
| @contexts/* | src/webparts/hbcProjectControls/components/contexts/* |
| @theme/* | src/webparts/hbcProjectControls/theme/* |
| @hbc/sp-services | packages/hbc-sp-services/src/index.ts |
| @hbc/sp-services/* | packages/hbc-sp-services/src/* |

**Removed aliases:** `@services/*`, `@models/*`, `@utils/*` — these now live in `@hbc/sp-services`.

---

## §2 Directory Structure

### src/

```
src/webparts/hbcProjectControls/
├── HbcProjectControlsWebPart.ts          # SPFx web part entry point
├── HbcProjectControlsWebPart.manifest.json
├── loc/                                   # Localization (en-us.js, mystrings.d.ts)
├── components/
│   ├── App.tsx                            # Root app: FluentProvider → ErrorBoundary → AppProvider → HashRouter → AppShell → Routes
│   ├── contexts/
│   │   ├── AppContext.tsx                 # Global context: dataService, currentUser, featureFlags, selectedProject, hasPermission, isFeatureEnabled
│   │   └── index.ts
│   ├── guards/
│   │   ├── FeatureGate.tsx               # Renders children only if feature flag enabled
│   │   ├── PermissionGate.tsx            # Renders children only if user has permission
│   │   ├── ProtectedRoute.tsx            # Redirects to /access-denied if permission missing
│   │   ├── ProjectRequiredRoute.tsx      # Shows "No Project Selected" if no selectedProject
│   │   ├── RoleGate.tsx                  # Renders children only if user has allowed role
│   │   └── index.ts
│   ├── hooks/                             # 38 custom hooks (see §7 for service method mapping)
│   │   ├── useActionInbox.ts             # Action inbox aggregation with auto-refresh
│   │   ├── useActiveProjects.ts          # Active projects portfolio
│   │   ├── useAssignmentMappings.ts     # Assignment mapping CRUD + resolution
│   │   ├── useBuyoutLog.ts              # Buyout log CRUD
│   │   ├── useCommitmentApproval.ts     # Commitment approval workflow
│   │   ├── useComplianceLog.ts          # Compliance log with filters
│   │   ├── useEstimating.ts             # Estimating tracker CRUD
│   │   ├── useEstimatingKickoff.ts      # Estimating kickoff CRUD + items
│   │   ├── useGoNoGo.ts                 # Go/No-Go scorecards
│   │   ├── useJobNumberRequest.ts       # Job number requests + reference data
│   │   ├── useKeyboardShortcut.ts      # Global keyboard shortcut registration
│   │   ├── useLeads.ts                  # Leads CRUD + search
│   │   ├── useLessonsLearned.ts         # Lessons learned CRUD
│   │   ├── useMarketingRecord.ts        # Marketing project records
│   │   ├── useMeetings.ts              # Meetings + calendar availability
│   │   ├── useMonthlyReview.ts          # Monthly review workflow
│   │   ├── useNotifications.ts          # Notification send + fetch
│   │   ├── usePermission.ts             # Single permission check (boolean)
│   │   ├── usePersistedState.ts         # SessionStorage-backed state persistence
│   │   ├── usePostBidAutopsy.ts         # Post-bid autopsy + finalization
│   │   ├── useProjectManagementPlan.ts  # PMP with approvals + signatures
│   │   ├── useProjectSchedule.ts        # Schedule + critical path items
│   │   ├── useQualityConcerns.ts        # Quality concerns CRUD
│   │   ├── useResponsibilityMatrix.ts   # Internal, owner-contract, sub-contract matrices
│   │   ├── useResponsive.ts             # Responsive breakpoint detection
│   │   ├── useRiskCostManagement.ts     # Risk/cost management CRUD
│   │   ├── useSafetyConcerns.ts         # Safety concerns CRUD
│   │   ├── useSectorDefinitions.ts     # Dynamic sector definitions CRUD
│   │   ├── useSelectedProject.ts        # Selected project from context
│   │   ├── useStartupChecklist.ts       # Startup checklist CRUD
│   │   ├── useSuperintendentPlan.ts     # Superintendent plan sections
│   │   ├── useTabFromUrl.ts            # URL-synced tab state for deep linking
│   │   ├── useTurnoverAgenda.ts       # Turnover meeting agenda CRUD + computed state + workflow
│   │   ├── useWorkflow.ts              # Composite workflow (team, deliverables, interview, contract, turnover, closeout, loss autopsy, stage transitions)
│   │   ├── usePermissionEngine.ts     # Permission engine hook
│   │   ├── useProvisioningTracker.ts  # Provisioning log aggregation + summary KPIs for dashboard widget
│   │   ├── useProvisioningValidation.ts # Centralized pre-provisioning validation composing validators.ts
│   │   ├── useWorkflowDefinitions.ts  # Workflow definition CRUD + resolution
│   │   └── index.ts
│   ├── layouts/
│   │   ├── AppShell.tsx                  # Main layout: sidebar + header + content area
│   │   ├── NavigationSidebar.tsx         # Left nav with groups/sub-groups/items (see §9)
│   │   └── index.ts
│   ├── pages/
│   │   ├── hub/                          # Hub-level pages (dashboard, leads, marketing, pipeline, admin)
│   │   │   ├── AccountingQueuePage.tsx
│   │   │   ├── ActiveProjectsDashboard.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── ComplianceLog.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── GoNoGoDetail.tsx
│   │   │   ├── GoNoGoMeetingScheduler.tsx
│   │   │   ├── GoNoGoScorecard.tsx
│   │   │   ├── JobNumberRequestForm.tsx
│   │   │   ├── LeadDetailPage.tsx
│   │   │   ├── LeadFormPage.tsx
│   │   │   ├── MarketingDashboard.tsx
│   │   │   ├── PermissionTemplateEditor.tsx
│   │   │   ├── PipelinePage.tsx
│   │   │   ├── ProjectAssignmentsPanel.tsx
│   │   │   ├── WorkflowDefinitionsPanel.tsx
│   │   │   └── index.ts
│   │   ├── precon/                       # Preconstruction pages (estimating, pursuits, autopsies)
│   │   │   ├── EstimatingDashboard.tsx
│   │   │   ├── EstimatingKickoffList.tsx
│   │   │   ├── EstimatingKickoffPage.tsx
│   │   │   ├── GoNoGoTracker.tsx
│   │   │   ├── PostBidAutopsyForm.tsx
│   │   │   ├── PostBidAutopsyList.tsx
│   │   │   ├── PursuitDetail.tsx
│   │   │   └── index.ts
│   │   ├── project/                      # Project execution pages (ops, matrices, PMP, controls)
│   │   │   ├── BuyoutLogPage.tsx
│   │   │   ├── CloseoutChecklist.tsx
│   │   │   ├── CommitmentApprovalPanel.tsx
│   │   │   ├── CommitmentForm.tsx
│   │   │   ├── ContractTracking.tsx
│   │   │   ├── DeliverablesTracker.tsx
│   │   │   ├── InternalResponsibilityMatrix.tsx
│   │   │   ├── InterviewPrep.tsx
│   │   │   ├── LessonsLearnedPage.tsx
│   │   │   ├── LossAutopsy.tsx
│   │   │   ├── MonthlyProjectReview.tsx
│   │   │   ├── OwnerContractMatrix.tsx
│   │   │   ├── pmp/
│   │   │   │   ├── PMPApprovalPanel.tsx
│   │   │   │   ├── PMPSection.tsx
│   │   │   │   ├── PMPSignatureBlock.tsx
│   │   │   │   └── ProjectManagementPlan.tsx
│   │   │   ├── PreconKickoff.tsx
│   │   │   ├── ProjectDashboard.tsx
│   │   │   ├── ProjectTeamPanel.tsx
│   │   │   ├── ProjectRecord.tsx
│   │   │   ├── ProjectScheduleCriticalPath.tsx
│   │   │   ├── ProjectStartupChecklist.tsx
│   │   │   ├── QualityConcernsTracker.tsx
│   │   │   ├── ResponsibilityMatrices.tsx
│   │   │   ├── RiskCostManagement.tsx
│   │   │   ├── SafetyConcernsTracker.tsx
│   │   │   ├── SubContractMatrix.tsx
│   │   │   ├── SuperintendentPlanPage.tsx
│   │   │   ├── TurnoverToOps.tsx
│   │   │   ├── WinLossRecorder.tsx
│   │   │   └── index.ts
│   │   └── shared/
│   │       └── AccessDeniedPage.tsx
│   └── shared/                           # 34 reusable components (see §5)
│       ├── ActivityTimeline.tsx
│       ├── AutopsyMeetingScheduler.tsx
│       ├── AzureADPeoplePicker.tsx
│       ├── Breadcrumb.tsx
│       ├── CollapsibleSection.tsx
│       ├── ConditionBuilder.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── ExportButtons.tsx
│       ├── GranularFlagEditor.tsx
│       ├── KickoffMeetingScheduler.tsx
│       ├── KPICard.tsx
│       ├── LoadingSpinner.tsx
│       ├── MeetingScheduler.tsx
│       ├── PageHeader.tsx
│       ├── PageLoader.tsx
│       ├── PipelineChart.tsx
│       ├── ProjectPicker.tsx
│       ├── ProvisioningStatus.tsx
│       ├── ScoreTierBadge.tsx
│       ├── SearchBar.tsx
│       ├── SkeletonLoader.tsx
│       ├── SlideDrawer.tsx
│       ├── StageBadge.tsx
│       ├── StageIndicator.tsx
│       ├── StatusBadge.tsx
│       ├── SyncStatusIndicator.tsx
│       ├── ToastContainer.tsx
│       ├── ToolPermissionMatrix.tsx
│       ├── WhatsNewModal.tsx
│       ├── WorkflowPreview.tsx
│       ├── WorkflowStepCard.tsx
│       └── index.ts
├── provisioning/
│   └── site-template.json                # SP site template definition
├── theme/
│   ├── globalStyles.ts                   # Global CSS injection
│   ├── hbcTheme.ts                      # Fluent UI v9 theme
│   └── tokens.ts                        # HBC_COLORS, BREAKPOINTS, SPACING, ELEVATION, TRANSITION
│
│   NOTE: models/, services/, utils/, mock/ have moved to packages/hbc-sp-services/src/
│   All app code imports from '@hbc/sp-services' instead of relative paths.
```

### dev/

```
dev/
├── index.html                # HTML template
├── index.tsx                 # DevRoot component: MockDataService + RoleSwitcher + App
├── mockContext.ts            # Mock SP context for local dev
├── RoleSwitcher.tsx          # Dev-only role switching UI
├── tsconfig.json             # Extends root tsconfig
├── webpack.config.js         # Dev server config (port 3000, mock mode)
├── shims/
│   ├── sp-core-library.ts   # Shim for @microsoft/sp-core-library
│   ├── sp-property-pane.ts   # Shim for @microsoft/sp-property-pane
│   └── sp-webpart-base.ts   # Shim for @microsoft/sp-webpart-base
└── dist/                     # Built dev output (gitignored)
```

### packages/hbc-sp-services/ (shared data layer library)

```
packages/hbc-sp-services/
├── package.json              # @hbc/sp-services, private, peerDeps on @pnp/*
├── tsconfig.json             # Standalone config (target es2017, module esnext)
├── src/
│   ├── index.ts              # Public barrel: re-exports models + services + utils + MOCK_USERS
│   ├── models/               # 45 files — all I*.ts + enums.ts + index.ts (see §6)
│   ├── services/             # 14 files — all service classes + index.ts (see §7)
│   │   ├── IDataService.ts   # Service interface (212 methods)
│   │   ├── MockDataService.ts # Mock implementation (all 212 implemented)
│   │   ├── SharePointDataService.ts # SP implementation (129 impl, 77 stubs, 6 delegation)
│   │   ├── AuditService.ts, CacheService.ts, ExportService.ts
│   │   ├── GraphService.ts, HubNavigationService.ts, NotificationService.ts
│   │   ├── OfflineQueueService.ts, PowerAutomateService.ts, ProvisioningService.ts
│   │   ├── columnMappings.ts  # SP column name mappings for all lists (1267 lines)
│   │   └── index.ts
│   ├── utils/                # 13 files — all utility functions (see §13)
│   └── mock/                 # 42 JSON files — mock data (see §12)
└── lib/                      # Compiled output (gitignored)
```

### config/

```
config/
├── config.json               # SPFx bundle entry point config
├── deploy-azure-storage.json # Azure CDN deployment (placeholders)
├── package-solution.json     # Solution packaging, Graph API permissions
├── serve.json                # Dev server: port 4321, HTTPS
└── write-manifests.json      # CDN base path placeholder
```

### docs/

```
docs/
├── DATA_ARCHITECTURE.md      # Data architecture documentation
├── PERMISSION_STRATEGY.md    # Permission strategy documentation
└── SECURITY_ANALYSIS.md      # Post-Phase 32 permissions & security analysis
```

### .github/

```
.github/
├── workflows/
│   ├── ci.yml                    # Full build + artifact upload
│   ├── release.yml               # Tag-triggered GitHub Release
│   └── pr-validation.yml         # Fast type-check + lint for PRs
└── dependabot.yml                # Dependency update automation
```

### Other Root Directories

```
scripts/
└── migrate-estimating-history.ts   # Migration script for estimating history

sharepoint/solution/debug/          # SPFx solution package output (auto-generated)
```

---

## §3 Entry Points

### SPFx Web Part

| Item | Value |
|------|-------|
| File | src/webparts/hbcProjectControls/HbcProjectControlsWebPart.ts |
| Class | `HbcProjectControlsWebPart extends BaseClientSideWebPart<IHbcProjectControlsWebPartProps>` |
| Props | `description?`, `dataServiceMode?: 'mock' \| 'sharepoint'` — controls which data service is instantiated |
| onInit() | If `dataServiceMode === 'sharepoint'`: creates `SharePointDataService`, initializes PnP SP via `spfi().using(SPFx(this.context))`, calls `spService.initializeContext()` with page context user, initializes `graphService` via `msGraphClientFactory.getClient('3')`, wires `graphService.setAuditLogger()` with dataService.logAudit. Otherwise: creates `MockDataService`. |
| render() | Creates `Root` via `createRoot(this.domElement)` (once), then calls `root.render(<App>)`. Uses React 18 concurrent-capable root API. |

### Standalone Dev Server

| Item | Value |
|------|-------|
| File | dev/index.tsx |
| Component | `DevRoot` wraps `<App>` with `<RoleSwitcher>` |
| Bootstrap | Creates `MockDataService`, mounts to `#root` via `createRoot().render()` |
| Features | Role switching, hash reset on role change |

### App.tsx

| Item | Value |
|------|-------|
| File | src/webparts/hbcProjectControls/components/App.tsx |
| Component Tree | `FluentProvider` → `ErrorBoundary` → `AppProvider(dataService, siteUrl?)` → `HashRouter` → `AppShell` → `Suspense(PageLoader)` → `AppRoutes` |
| Router Type | `HashRouter` from react-router-dom |
| Code Splitting | 40 page components lazy-loaded via `React.lazy()` + `lazyNamed()` helper; shell/guards/providers in main bundle |
| Route Count | 49 routes (see §8) |

---

## §4 Architecture Patterns

### Hook Pattern
- Every data-fetching feature uses: `useAppContext()` → `useState` for data/loading/error → `useCallback` with `[dataService]` dependency
- Hooks call `dataService.methodName()` in callbacks, never directly in render
- All hooks exported from `components/hooks/index.ts` barrel

### Mock Data Flow
- JSON file in `mock/` → `MockDataService` loads via `require()` → deep-clones on read → hook fetches via `useCallback` → component renders
- `MockDataService` maintains in-memory state for mutations (create/update/delete) on top of initial JSON data
- Flattened child collections assembled in `MockDataService`: flat arrays → `assemble*()` helpers → nested return shape (e.g., kickoff items grouped into kickoff object)

### Auto-Save Pattern
- `onBlur` on field → hook method (e.g., `updateChecklistItem`) → `dataService.updateX()` → `auditService.log()` (fire-and-forget)
- No explicit save buttons on most operational forms

### RBAC Pattern
- Azure AD group membership → maps to `RoleName` → `ROLE_PERMISSIONS[role]` provides permission strings → `currentUser.permissions: Set<string>`
- `hasPermission(key)` checks `currentUser.permissions.has(key)`
- Guard components: `RoleGate` (checks role array), `PermissionGate` (checks single permission), `ProtectedRoute` (redirects to /access-denied), `FeatureGate` (checks feature flag), `ProjectRequiredRoute` (requires selectedProject)

### Navigation Pattern
- `selectedProject` stored in `AppContext` → `NavigationSidebar` shows/hides items based on `NAV_GROUP_ROLES[groupKey]` and `hasPermission(item.permission)`
- Items with `requiresProject: true` are disabled (not hidden) when no project selected
- `ProjectPicker` component at top of sidebar sets `selectedProject`

### Audit Logging Pattern
- Fire-and-forget: `auditService.log({ Action: AuditAction.SomeAction, ... })` — queued, flushed after 2s debounce
- Action names use PascalCase enum values (e.g., `LeadCreated`, `ChecklistItemUpdated`)
- Always includes: User, Timestamp, EntityType, EntityId, ProjectCode (when applicable)

### Feature Flag Pattern
- `Feature_Flags` SP list (mock: `featureFlags.json`) → loaded at app init → `isFeatureEnabled(name)` checks enabled + role filter
- `<FeatureGate featureName="X">` conditionally renders children

### Hybrid CSS Pattern (makeStyles + minimal inline)
- **Structural styles**: Use `makeStyles()` from `@fluentui/react-components` (Griffel CSS-in-JS) — layout, spacing, borders, fonts, hover states, transitions
- **Dynamic/data-driven styles**: Keep as minimal inline `style={{}}` — colors from props, computed widths, per-item config values
- **Fluent tokens**: Use `tokens.*` for semantic colors where a matching token exists (e.g., `tokens.colorNeutralBackground1` instead of `HBC_COLORS.white`)
- **HBC brand colors**: Use `HBC_COLORS.*` for brand-specific colors with no Fluent equivalent (e.g., `HBC_COLORS.orange`, `HBC_COLORS.navy`, score tier colors)
- **Conditional classes**: Use `mergeClasses()` for state-based class application (active/inactive, expanded/collapsed)
- **Global reusable classes**: `theme/globalStyles.ts` provides 40+ shared Griffel classes (card, formGrid, kpiGrid, actionBar, etc.)
- **No CSS modules or SCSS files** — all styling is either makeStyles or inline
- **Legacy pages**: Many page-level components still use inline `style={{}}` — shared components (AppShell, NavigationSidebar, DataTable, KPICard, SearchBar, PageHeader, StageBadge, StatusBadge, ExportButtons, LoadingSpinner) have been migrated to makeStyles

### Denormalized Field Pattern
- Fields copied from source (usually `Leads_Master`) are annotated with `/** @denormalized — source: Leads_Master.FieldName */`
- `syncDenormalizedFields(leadId)` propagates changes from lead to all dependent records
- Examples: `projectName` from `Leads_Master.Title`, `contractAmount` from `Leads_Master.ProjectValue`

### Site Detection Pattern
- `detectSiteContext(siteUrl, hubSiteUrl)` from `utils/siteDetector.ts` determines if the current SP site is the hub or a project-specific site
- `AppContext.isProjectSite` is `true` when launched from a project-specific SP site (URL contains a project code)
- On project sites: picker is locked (read-only), project auto-selected via `searchLeads()`, `setSelectedProject(null)` is blocked
- On hub sites: picker is interactive; selecting a project hides `hubOnly` nav items (multi-project views) and shows dynamic project-scoped items
- `dataService.setProjectSiteUrl()` is called when `selectedProject` changes to enable dual-web data routing in `SharePointDataService`
- Supports both dashed (`25-042-01`) and dashless (`2504201`) project code formats in URLs

---

## §5 Shared Components

| Component | File | Key Props | Used By (approx) |
|-----------|------|-----------|-------------------|
| ActivityTimeline | components/shared/ActivityTimeline.tsx | entries: ITimelineEntry[], maxItems?, emptyMessage? | ~0 (available) |
| AutopsyMeetingScheduler | components/shared/AutopsyMeetingScheduler.tsx | attendeeEmails, leadId?, projectCode?, onScheduled?, onCancel? | ~1 |
| AzureADPeoplePicker | components/shared/AzureADPeoplePicker.tsx | Single: selectedUser, onSelect; Multi: multiSelect=true, selectedUsers, onSelectMulti; Common: label?, placeholder?, disabled? | ~4 |
| Breadcrumb | components/shared/Breadcrumb.tsx | items: IBreadcrumbItem[] | ~38 |
| CollapsibleSection | components/shared/CollapsibleSection.tsx | title, subtitle?, defaultExpanded?, badge?, children | ~0 (available) |
| ConditionBuilder | components/shared/ConditionBuilder.tsx | assignment, onChange, onRemove, disabled? | ~1 |
| ConfirmDialog | components/shared/ConfirmDialog.tsx | open, title, message, confirmLabel?, cancelLabel?, onConfirm, onCancel, danger? | ~1 |
| DataTable | components/shared/DataTable.tsx | columns: IDataTableColumn<T>[] (key, header, render, sortable?, width?, minWidth?, hideOnMobile?), items, keyExtractor, isLoading?, onRowClick?, sortField?, onSort?, pageSize? | ~12 |
| EmptyState | components/shared/EmptyState.tsx | title, description?, icon?, action? | internal (DataTable) |
| ErrorBoundary | components/shared/ErrorBoundary.tsx | children, fallback? | 1 (App.tsx root) |
| ExportButtons | components/shared/ExportButtons.tsx | pdfElementId?, data?, filename, title? | ~10 |
| GranularFlagEditor | components/shared/GranularFlagEditor.tsx | flags: IGranularFlagDef[], selectedFlags: string[], onChange, disabled? | ~1 (ToolPermissionMatrix) |
| KickoffMeetingScheduler | components/shared/KickoffMeetingScheduler.tsx | attendeeEmails, leadId?, projectCode?, onScheduled?, onCancel? | ~1 |
| KPICard | components/shared/KPICard.tsx | title, value, subtitle?, icon?, trend?, onClick? | ~8 |
| LoadingSpinner | components/shared/LoadingSpinner.tsx | label?, size? ('tiny'\|'small'\|'medium'\|'large') | ~30+ |
| MeetingScheduler | components/shared/MeetingScheduler.tsx | meetingType, subject, attendeeEmails, leadId?, projectCode?, startDate, endDate, onScheduled, onCancel? | ~1 |
| PageHeader | components/shared/PageHeader.tsx | title, subtitle?, actions?, breadcrumb? | ~30+ |
| PageLoader | components/shared/PageLoader.tsx | (none) | 1 (App.tsx Suspense fallback) |
| PipelineChart | components/shared/PipelineChart.tsx | leads, mode? ('count'\|'value'), height? | ~2 |
| ProjectPicker | components/shared/ProjectPicker.tsx | selected, onSelect, locked? | 1 (NavigationSidebar) |
| ProvisioningStatus | components/shared/ProvisioningStatus.tsx | projectCode, log?, pollInterval?, compact? | ~3 |
| ScoreTierBadge | components/shared/ScoreTierBadge.tsx | score, showLabel? | ~3 |
| SearchBar | components/shared/SearchBar.tsx | placeholder? | 1 (AppShell) |
| SkeletonLoader | components/shared/SkeletonLoader.tsx | variant: 'table'\|'kpi-grid'\|'form'\|'card'\|'text', rows?, columns?, style? | ~37 |
| SlideDrawer | components/shared/SlideDrawer.tsx | isOpen, onClose, title?, width?, children | ~0 (available) |
| StageBadge | components/shared/StageBadge.tsx | stage, size? ('small'\|'medium') | ~4 |
| StageIndicator | components/shared/StageIndicator.tsx | currentStage, size? | ~1 |
| StatusBadge | components/shared/StatusBadge.tsx | label, color, backgroundColor, size? | ~5 |
| SyncStatusIndicator | components/shared/SyncStatusIndicator.tsx | (none) | 1 (AppShell) |
| ToastProvider/useToast | components/shared/ToastContainer.tsx | children (provider), addToast(message, type?, duration?) (hook) | 1 (App.tsx) + 5 pages |
| ToolPermissionMatrix | components/shared/ToolPermissionMatrix.tsx | toolAccess: IToolAccess[], onChange, disabled? | ~1 (PermissionTemplateEditor) |
| WhatsNewModal | components/shared/WhatsNewModal.tsx | isOpen, onClose | 1 (AppShell) |
| WorkflowPreview | components/shared/WorkflowPreview.tsx | workflowKey, onClose | ~1 |
| WorkflowStepCard | components/shared/WorkflowStepCard.tsx | step, isExpanded, onToggle, onUpdateStep, onAddCondition, onUpdateCondition, onRemoveCondition, disabled? | ~1 |

---

## §6 Data Models

### Interfaces

| Interface | File | Key Fields | SP List Name | Site |
|-----------|------|------------|--------------|------|
| ILead | models/ILead.ts | id, Title, ClientName, AddressStreet?, AddressCity?, AddressState?, AddressZip?, DateSubmitted?, Region, Sector, Division, Stage, ProjectCode?, ProjectValue?, GoNoGoDecision?, WinLossDecision? | Leads_Master | Hub |
| ILeadFormData | models/ILead.ts | extends Omit<ILead, 'id'\|'DateOfEvaluation'\|'Originator'\|'OriginatorId'> | Leads_Master | Hub |
| IGoNoGoScorecard | models/IGoNoGoScorecard.ts | id, LeadID, scores, TotalScore_Orig?, TotalScore_Cmte?, Decision?, DecisionDate? | GoNoGo_Scorecard | Hub |
| IScorecardCriterion | models/IGoNoGoScorecard.ts | id, label, high, avg, low | GoNoGo_Scorecard | Hub |
| IEstimatingTracker | models/IEstimatingTracker.ts | id, Title (@denormalized), LeadID, ProjectCode, Source?, DeliverableType?, DueDate_OutTheDoor?, LeadEstimator?, AwardStatus? | Estimating_Tracker | Hub |
| IEstimatingKickoff | models/IEstimatingKickoff.ts | id, LeadID, ProjectCode, Architect?, ProposalDueDateTime?, keyPersonnel?: IKeyPersonnelEntry[], items: IEstimatingKickoffItem[] | Estimating_Kickoffs | Hub |
| IKeyPersonnelEntry | models/IEstimatingKickoff.ts | id, label, person: IPersonAssignment | Estimating_Kickoffs (JSON) | Hub |
| IEstimatingKickoffItem | models/IEstimatingKickoff.ts | id, kickoffId?, section, task, status, responsibleParty?, assignees?: IPersonAssignment[], sortOrder | Estimating_Kickoff_Items | Hub |
| IJobNumberRequest | models/IJobNumberRequest.ts | id, LeadID, RequestDate, Originator, ProjectExecutive (@denormalized), ProjectManager? (@denormalized), RequestStatus, AssignedJobNumber? | Job_Number_Requests | Hub |
| ILossAutopsy | models/ILossAutopsy.ts | id, leadId, actionItems: IActionItem[], processScore, overallRating, isFinalized | Loss_Autopsies | Hub |
| IMarketingProjectRecord | models/IMarketingProjectRecord.ts | projectName (@denormalized), projectCode, contractBudget (@denormalized), sectionCompletion, overallCompletion | Marketing_Project_Records | Hub |
| IProjectRecordSection | models/IMarketingProjectRecord.ts | key, label, order | — | — |
| IActiveProject | models/IActiveProject.ts | id, jobNumber, projectCode, projectName, status, sector, personnel, financials, schedule, riskMetrics | Active_Projects_Portfolio | Hub |
| IProjectPersonnel | models/IActiveProject.ts | projectExecutive?, leadPM?, additionalPM?, projectAccountant?, leadSuper? | Active_Projects_Portfolio | Hub |
| IProjectFinancials | models/IActiveProject.ts | originalContract?, changeOrders?, currentContractValue?, billingsToDate?, projectedFee? | Active_Projects_Portfolio | Hub |
| IProjectSchedule | models/IActiveProject.ts | startDate?, substantialCompletionDate?, currentPhase?, percentComplete? | Active_Projects_Portfolio | Hub |
| IProjectRiskMetrics | models/IActiveProject.ts | averageQScore?, openWaiverCount?, complianceStatus? | Active_Projects_Portfolio | Hub |
| IPortfolioSummary | models/IActiveProject.ts | totalBacklog, totalOriginalContract, projectCount, projectsByStatus, projectsWithAlerts | — | — |
| IPersonnelWorkload | models/IActiveProject.ts | name, email?, role, projectCount, totalContractValue, projects | — | — |
| IAlertThresholds | models/IActiveProject.ts | unbilledWarningPct, feeErosionPct, scheduleDelayDays | — | — |
| IActionInboxItem | models/IActionInbox.ts | id, workflowType: WorkflowActionType, actionLabel, projectCode, projectName, entityId, requestedBy, requestedDate, waitingDays, routePath, priority: ActionPriority | — (aggregated) | — |
| IRole | models/IRole.ts | id, Title: RoleName, UserOrGroup, Permissions, IsActive | App_Roles | Hub |
| ICurrentUser | models/IRole.ts | id, displayName, email, loginName, roles: RoleName[], permissions: Set<string>, identityType?: 'Internal' \| 'External' | — | — |
| IFeatureFlag | models/IFeatureFlag.ts | id, FeatureName, DisplayName, Enabled, EnabledForRoles?, TargetDate?, Notes?, Category?: FeatureFlagCategory | Feature_Flags | Hub |
| IAuditEntry | models/IAuditEntry.ts | id, Timestamp, User, Action: AuditAction, EntityType, EntityId, ProjectCode?, FieldChanged?, Details | Audit_Log | Hub |
| IProvisioningLog | models/IProvisioningLog.ts | id, projectCode, projectName (@denormalized), status: ProvisioningStatus, currentStep, siteUrl?, hubNavLinkStatus? | Provisioning_Log | Hub |
| INotification | models/INotification.ts | id, type: NotificationType, subject, body, recipients, status | — | — |
| IMeeting | models/IMeeting.ts | id, subject, type: MeetingType, startTime, endTime, attendees, teamsLink? | — | — |
| ITimeSlot | models/IMeeting.ts | start, end, available | — | — |
| ICalendarAvailability | models/IMeeting.ts | email, displayName, slots: ITimeSlot[] | — | — |
| IActionItem | models/IActionItem.ts | id, projectCode?, autopsyId?, description, assignee, status: ActionItemStatus | Action_Items | Project |
| ITeamMember | models/ITeamMember.ts | id, projectCode, name, email, role: RoleName, department | Team_Members | Project |
| IDeliverable | models/IDeliverable.ts | id, projectCode, name, department, assignedTo, status: DeliverableStatus, dueDate | Deliverables | Project |
| IInterviewPrep | models/IInterviewPrep.ts | id, leadId, projectCode, interviewDate?, panelMembers, presentationTheme? | Interview_Prep | Project |
| IContractInfo | models/IContractInfo.ts | id, leadId, projectCode, contractStatus, contractType?, contractValue? | Contract_Info | Project |
| ITurnoverItem | models/ITurnoverItem.ts | id, projectCode, category: TurnoverCategory, description, status, assignedTo | Turnover_Checklist | Project |
| ICloseoutItem | models/ICloseoutItem.ts | id, projectCode, category, description, status, assignedTo | Closeout_Items | Project |
| IBuyoutEntry | models/IBuyoutEntry.ts | id, projectCode, divisionCode, divisionDescription, originalBudget, totalBudget, subcontractorName?, commitmentStatus, eVerifyStatus?, approvalHistory | Buyout_Log | Project |
| ICommitmentApproval | models/ICommitmentApproval.ts | id, buyoutEntryId, projectCode, step: ApprovalStep, approverName, status, comment? | Commitment_Approvals | Project |
| IRiskAssessment | models/ICommitmentApproval.ts | triggers, requiresWaiver, escalationLevel, qScoreWarning | — | — |
| IComplianceSummary | models/IComplianceSummary.ts | totalCommitments, fullyCompliant, eVerifyPending, eVerifyOverdue, waiversPending | — | — |
| IComplianceEntry | models/IComplianceSummary.ts | id, projectCode, projectName, subcontractorName, commitmentStatus, eVerifyStatus, overallCompliant | — | — |
| IComplianceLogFilter | models/IComplianceSummary.ts | commitmentStatus?, eVerifyStatus?, projectCode?, searchQuery? | — | — |
| IStartupChecklistItem | models/IStartupChecklist.ts | id, projectCode, sectionNumber, sectionName, itemNumber, label, responseType, response, status, activityLog | Startup_Checklist | Project |
| IChecklistActivityEntry | models/IStartupChecklist.ts | id?, checklistItemId?, timestamp, user, previousValue, newValue | Checklist_Activity_Log | Project |
| IStartupChecklistSummary | models/IStartupChecklist.ts | total, conforming, deficient, na, neutral, noResponse | — | — |
| IChecklistSection | models/IStartupChecklist.ts | number, name, itemCount | — | — |
| IInternalMatrixTask | models/IResponsibilityMatrix.ts | id, projectCode, sortOrder, taskCategory, taskDescription, PX, SrPM, PM2, PM1, PA, QAQC, ProjAcct, isCustom | Internal_Matrix | Project |
| ITeamRoleAssignment | models/IResponsibilityMatrix.ts | projectCode, roleAbbreviation, assignedPerson, assignedPersonEmail | Internal_Matrix | Project |
| IRecurringCalendarItem | models/IResponsibilityMatrix.ts | id, projectCode, role, duePattern, description, isActive | Internal_Matrix | Project |
| IOwnerContractArticle | models/IResponsibilityMatrix.ts | id, projectCode, sortOrder, articleNumber, pageNumber, responsibleParty, description, isCustom | Owner_Contract_Matrix | Project |
| ISubContractClause | models/IResponsibilityMatrix.ts | id, projectCode, sortOrder, refNumber, pageNumber, clauseDescription, ProjExec, ProjMgr, AsstPM, Super, ProjAdmin, isCustom | Sub_Contract_Matrix | Project |
| IRiskCostManagement | models/IRiskCostManagement.ts | id, projectCode, contractType, contractAmount (@denormalized), buyoutOpportunities, potentialRisks, potentialSavings | Risk_Cost_Management | Project |
| IRiskCostItem | models/IRiskCostManagement.ts | id, projectCode?, category, letter, description, estimatedValue, status | Risk_Cost_Items | Project |
| IQualityConcern | models/IQualityConcerns.ts | id, projectCode, letter, description, status, resolution, resolvedDate | Quality_Concerns | Project |
| ISafetyConcern | models/ISafetyConcerns.ts | id, projectCode, safetyOfficerName, letter, description, severity, status, resolution | Safety_Concerns | Project |
| IProjectScheduleCriticalPath | models/IProjectScheduleCriticalPath.ts | id, projectCode, startDate, substantialCompletionDate, contractCalendarDays, hasLiquidatedDamages, criticalPathConcerns | Project_Schedule | Project |
| ICriticalPathItem | models/IProjectScheduleCriticalPath.ts | id, projectCode?, letter, description, impactDescription, status, mitigationPlan | Critical_Path_Items | Project |
| ISuperintendentPlan | models/ISuperintendentPlan.ts | id, projectCode, superintendentName, sections: ISuperintendentPlanSection[] | Superintendent_Plan | Project |
| ISuperintendentPlanSection | models/ISuperintendentPlan.ts | id, superintendentPlanId?, sectionKey, sectionTitle, content, isComplete | Superintendent_Plan_Sections | Project |
| ISuperintendentPlanSectionDef | models/ISuperintendentPlan.ts | key, title, guidance | — | — |
| ILessonLearned | models/ILessonsLearned.ts | id, projectCode, title, category, impact, description, recommendation, isIncludedInFinalRecord | Lessons_Learned | Project |
| IProjectManagementPlan | models/IProjectManagementPlan.ts | id, projectCode, projectName (@denormalized), jobNumber, status, currentCycleNumber, startupSignatures, completionSignatures, approvalCycles, boilerplate | Project_Management_Plans | Project |
| IPMPSignature | models/IProjectManagementPlan.ts | id, pmpId?, signatureType, role, personName, status, signedDate | PMP_Signatures | Project |
| IPMPApprovalStep | models/IProjectManagementPlan.ts | id, approvalCycleId?, stepOrder, approverRole, approverName, status, comment | PMP_Approval_Steps | Project |
| IPMPApprovalCycle | models/IProjectManagementPlan.ts | id?, pmpId?, cycleNumber, submittedBy, status, steps, changesFromPrevious | PMP_Approval_Cycles | Project |
| IPMPBoilerplateSection | models/IProjectManagementPlan.ts | sectionNumber, sectionTitle, content, sourceDocumentUrl | — | — |
| IDivisionApprover | models/IProjectManagementPlan.ts | id, division, approverName, approverEmail, approverTitle | — | — |
| IPMPSectionDef | models/IProjectManagementPlan.ts | number, title, sourceType | — | — |
| IMonthlyProjectReview | models/IMonthlyProjectReview.ts | id, projectCode, reviewMonth, status, dueDate, checklistItems, followUps, reportDocumentUrls | Monthly_Reviews | Project |
| IMonthlyChecklistItem | models/IMonthlyProjectReview.ts | id, reviewId?, sectionKey, sectionTitle, itemKey, itemDescription, pmComment, pxComment | Monthly_Checklist_Items | Project |
| IMonthlyFollowUp | models/IMonthlyProjectReview.ts | id, reviewId?, question, requestedBy, pmResponse, status | Monthly_Follow_Ups | Project |
| IMonthlyChecklistSectionDef | models/IMonthlyProjectReview.ts | key, title, items: {key, description}[] | — | — |
| IProjectType | models/IProjectType.ts | code, label, office | Project_Types | Hub |
| IStandardCostCode | models/IStandardCostCode.ts | id, description, phase, division, isDefault | Standard_Cost_Codes | Hub |
| ISectorDefinition | models/ISectorDefinition.ts | id, code, label, isActive, parentDivision?, sortOrder | Sector_Definitions | Hub |
| IAssignmentMapping | models/IAssignmentMapping.ts | id, region, sector, assignmentType: AssignmentType, assignee: {userId, displayName, email} | Assignment_Mappings | Hub |
| IWorkflowDefinition | models/IWorkflowDefinition.ts | id, workflowKey, name, description, steps, isActive, lastModifiedBy, lastModifiedDate | Workflow_Definitions | Hub |
| IWorkflowStep | models/IWorkflowDefinition.ts | id, workflowId, stepOrder, name, assignmentType, projectRole?, defaultAssignee?, conditionalAssignees, isConditional, actionLabel, canChairMeeting?, featureFlagName?, isSkippable? | Workflow_Steps | Hub |
| IPersonAssignment | models/IWorkflowDefinition.ts | userId, displayName, email | — | — |
| IConditionalAssignment | models/IWorkflowDefinition.ts | id, stepId, conditions, assignee, priority | Workflow_Conditional_Assignments | Hub |
| IAssignmentCondition | models/IWorkflowDefinition.ts | field, operator, value | — | — |
| IWorkflowStepOverride | models/IWorkflowDefinition.ts | id, projectCode, workflowKey, stepId, overrideAssignee, overrideReason?, overriddenBy, overriddenDate | Workflow_Step_Overrides | Hub |
| IResolvedWorkflowStep | models/IWorkflowDefinition.ts | stepId, stepOrder, name, assignee, assignmentSource, isConditional, conditionMet, actionLabel, canChairMeeting, skipped?, skipReason? | — | — |
| ITurnoverAgenda | models/ITurnoverAgenda.ts | id, projectCode, leadId, status: TurnoverStatus, header, estimateOverview, prerequisites, discussionItems, subcontractors, exhibits, signatures | Turnover_Agendas | Project |
| ITurnoverProjectHeader | models/ITurnoverAgenda.ts | projectName, clientName, projectValue, region, sector, division, deliveryMethod, projectCode, overrides | Turnover_Agendas | Project |
| ITurnoverEstimateOverview | models/ITurnoverAgenda.ts | id, turnoverAgendaId, estimatedCost, contractAmount, contingency, allowances, designBudget, overrides | Turnover_Estimate_Overviews | Project |
| ITurnoverPrerequisite | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, description, completed, completedBy?, completedDate? | Turnover_Prerequisites | Project |
| ITurnoverDiscussionItem | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, description, discussed, notes, attachments | Turnover_Discussion_Items | Project |
| ITurnoverSubcontractor | models/ITurnoverAgenda.ts | id, turnoverAgendaId, trade, companyName, contactName, contactPhone, contactEmail, qScore, isPreferred, isRequired | Turnover_Subcontractors | Project |
| ITurnoverExhibit | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, reviewed, fileUrl?, fileName?, linkedDocumentUrl?, isCustom | Turnover_Exhibits | Project |
| ITurnoverSignature | models/ITurnoverAgenda.ts | id, turnoverAgendaId, role, personName, personEmail, signed, signedDate?, comment?, affidavitText, sortOrder | Turnover_Signatures | Project |
| ITurnoverAttachment | models/ITurnoverAgenda.ts | id, discussionItemId, fileName, fileUrl, uploadedBy, uploadedDate, fileSize | Turnover_Attachments | Project |
| IPermissionTemplate | models/IPermissionTemplate.ts | id, name, description, isGlobal, globalAccess, identityType, toolAccess: IToolAccess[], isDefault, isActive, version, promotedFromTier? | Permission_Templates | Hub |
| ISecurityGroupMapping | models/IPermissionTemplate.ts | id, securityGroupId, securityGroupName, defaultTemplateId, isActive | Security_Group_Mappings | Hub |
| IProjectTeamAssignment | models/IPermissionTemplate.ts | id, projectCode, userId, userDisplayName, userEmail, assignedRole, templateOverrideId?, granularFlagOverrides?, isActive | Project_Team_Assignments | Hub |
| IToolAccess | models/IPermissionTemplate.ts | toolKey, level: PermissionLevel, granularFlags? | — | — |
| IGranularFlagOverride | models/IPermissionTemplate.ts | toolKey, flags: string[] | — | — |
| IToolDefinition | models/IPermissionTemplate.ts | toolKey, toolGroup, label, description, levels, granularFlags | — | — |
| IGranularFlagDef | models/IPermissionTemplate.ts | key, label, description, permissions | — | — |
| IResolvedPermissions | models/IPermissionTemplate.ts | userId, projectCode, templateId, templateName, source, toolLevels, granularFlags, permissions: Set<string>, globalAccess | — | — |
| IEnvironmentConfig | models/IEnvironmentConfig.ts | currentTier: EnvironmentTier, label, color, isReadOnly, promotionHistory: IPromotionRecord[] | Environment_Config | Hub |
| IPromotionRecord | models/IEnvironmentConfig.ts | fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy, promotedDate, templateCount | — | — |

### Enums (models/enums.ts)

| Enum | Values |
|------|--------|
| Stage | LeadDiscovery, GoNoGoPending, GoNoGoWait, Opportunity, Pursuit, WonContractPending, ActiveConstruction, Closeout, ArchivedNoGo, ArchivedLoss, ArchivedHistorical |
| Region | Miami, WestPalmBeach, MartinCounty, Orlando, Tallahassee |
| Sector (deprecated -- use dynamic sector definitions) | Airport, City, Commercial, County, Federal, GolfClubCourse, MixedUse, MultiFamily, Municipal, ParkingGarage, State, Warehouse |
| Division | Commercial, LuxuryResidential |
| DepartmentOfOrigin | BusinessDevelopment, Estimating, Marketing, Operations, Other |
| DeliveryMethod | GMP, HardBid, PreconWithGMP, Other |
| GoNoGoDecision | Go, NoGo, ConditionalGo |
| ScorecardStatus | BDDraft, AwaitingDirectorReview, DirectorReturnedForRevision, AwaitingCommitteeScoring, CommitteeReturnedForRevision, Rejected, NoGo, Go, Locked, Unlocked |
| WinLossDecision | Win, Loss |
| LossReason | Price, Relationship, Experience, Schedule, Competition, Other |
| RoleName | BDRepresentative, EstimatingCoordinator, AccountingManager, PreconstructionTeam, OperationsTeam, ExecutiveLeadership, Legal, RiskManagement, Marketing, QualityControl, Safety, IDS, DepartmentDirector, SharePointAdmin |
| ProvisioningStatus | Queued, InProgress, Completed, PartialFailure, Failed |
| TurnoverStatus | Draft, PrerequisitesInProgress, MeetingScheduled, MeetingComplete, PendingSignatures, Signed, Complete |
| AuditAction | LeadCreated, LeadEdited, GoNoGoScoreSubmitted, GoNoGoDecisionMade, SiteProvisioningTriggered, SiteProvisioningCompleted, EstimateCreated, EstimateStatusChanged, TurnoverInitiated, TurnoverCompleted, PermissionChanged, MeetingScheduled, LossRecorded, AutopsyCompleted, ConfigFeatureFlagChanged, ConfigRoleChanged, ChecklistItemUpdated, ChecklistItemAdded, ChecklistSignedOff, MatrixAssignmentChanged, MatrixTaskAdded, ProjectRecordUpdated, ProjectRecordCreated, PMPSubmitted, PMPApproved, PMPReturned, PMPSigned, RiskItemUpdated, QualityConcernUpdated, SafetyConcernUpdated, ScheduleUpdated, SuperPlanUpdated, LessonAdded, MonthlyReviewSubmitted, MonthlyReviewAdvanced, WorkflowStepUpdated, WorkflowConditionAdded, WorkflowConditionRemoved, WorkflowOverrideSet, WorkflowOverrideRemoved, TurnoverAgendaCreated, TurnoverPrerequisiteCompleted, TurnoverItemDiscussed, TurnoverSubcontractorAdded, TurnoverSubcontractorRemoved, TurnoverExhibitReviewed, TurnoverExhibitAdded, TurnoverExhibitRemoved, TurnoverSigned, TurnoverAgendaCompleted, HubNavLinkCreated, HubNavLinkFailed, HubNavLinkRetried, HubNavLinkRemoved, HubSiteUrlUpdated, TemplateCreated, TemplateUpdated, TemplateDeleted, ProjectTeamAssigned, ProjectTeamRemoved, ProjectTeamOverridden, SecurityGroupMappingChanged, PermissionResolved, ScorecardArchived, LeadFolderCreated, AssignmentMappingUpdated, GraphApiCallSucceeded, GraphApiCallFailed, GraphGroupMemberAdded, GraphGroupMemberAddFailed |
| EntityType | Lead, Scorecard, Estimate, Project, Permission, Config, Checklist, Matrix, ProjectRecord, RiskCost, Quality, Safety, Schedule, SuperintendentPlan, LessonLearned, PMP, MonthlyReview, WorkflowDefinition, TurnoverAgenda, PermissionTemplate, ProjectTeamAssignment, AssignmentMapping, GraphApi |
| DeliverableStatus | NotStarted, InProgress, InReview, Complete |
| ActionItemStatus | Open, InProgress, Complete |
| Priority | Low, Medium, High, Critical |
| TurnoverCategory | Documents, Safety, Financial, Scheduling, Staffing, Subcontracts |
| AwardStatus | Pending, AwardedWithPrecon, AwardedWithoutPrecon, NotAwarded |
| EstimateSource | ClientRequest, RFP, RFQ, Referral, Other |
| DeliverableType | GMP, ConceptualEst, LumpSumProposal, Schematic, DDEst, ROM, RFP, HardBid, Other |
| MeetingType | GoNoGo, Kickoff, PreconKickoff, RedTeam, WinStrategy, Autopsy, LossAutopsy, Turnover, Other |
| NotificationType | Email, Teams, Both |
| ActiveProjectStatus | Precon, Construction, FinalPayment |
| NotificationEvent | LeadSubmitted, GoNoGoScoringRequested, GoNoGoDecisionMade, SiteProvisioned, PreconKickoff, DeliverableDueApproaching, WinLossRecorded, AutopsyScheduled, TurnoverCompleted, SafetyFolderChanged, PMPSignatureRequested, PMPSubmittedForApproval, PMPApprovalRequired, PMPApproved, PMPReturnedForRevision, MonthlyReviewDueNotification, MonthlyReviewSubmittedToPX, MonthlyReviewReturnedToPM, MonthlyReviewSubmittedToLeadership, JobNumberRequested, JobNumberAssigned, EstimatingKickoffScheduled, AutopsyFinalized, CommitmentSubmitted, CommitmentWaiverRequired, CommitmentApproved, CommitmentEscalatedToCFO, CommitmentRejected, ScorecardSubmittedToDirector, ScorecardReturnedByDirector, ScorecardRejectedByDirector, ScorecardAdvancedToCommittee, ScorecardApprovedGo, ScorecardDecidedNoGo, EstimatingCoordinatorNotifiedGo |
| WorkflowKey | GO_NO_GO, PMP_APPROVAL, MONTHLY_REVIEW, COMMITMENT_APPROVAL, TURNOVER_APPROVAL |
| StepAssignmentType | ProjectRole, NamedPerson |
| ConditionField | Division, Region, Sector |
| WorkflowActionType | GoNoGoReview, GoNoGoRevision, PMPApproval, PMPSignature, MonthlyReviewInput, MonthlyReviewValidation, CommitmentApproval, TurnoverSignature |
| ActionPriority | Urgent, Normal, New |
| PermissionLevel | NONE, READ_ONLY, STANDARD, ADMIN |

### Type Aliases

| Alias | File | Definition |
|-------|------|------------|
| FeatureFlagCategory | models/IFeatureFlag.ts | 'Core Platform' \| 'Preconstruction' \| 'Project Execution' \| 'Infrastructure' \| 'Integrations' |
| RiskCostCategory | models/IRiskCostManagement.ts | 'Buyout' \| 'Risk' \| 'Savings' |
| RiskCostItemStatus | models/IRiskCostManagement.ts | 'Open' \| 'Realized' \| 'Mitigated' \| 'Closed' |
| JobNumberRequestStatus | models/IJobNumberRequest.ts | Pending, Completed (enum) |
| BuyoutStatus | models/IBuyoutEntry.ts | 'Not Started' \| 'In Progress' \| 'Awarded' \| 'Executed' |
| CompassPreQualStatus | models/IBuyoutEntry.ts | 'Approved' \| 'Pending' \| 'Expired' \| 'Not Registered' |
| EVerifyStatus | models/IBuyoutEntry.ts | 'Not Sent' \| 'Sent' \| 'Reminder Sent' \| 'Received' \| 'Overdue' |
| CommitmentStatus | models/ICommitmentApproval.ts | 'Budgeted' \| 'PendingReview' \| 'WaiverPending' \| 'PXApproved' \| 'ComplianceReview' \| 'CFOReview' \| 'Committed' \| 'Rejected' |
| WaiverType | models/ICommitmentApproval.ts | 'SDI' \| 'Bond' \| 'Insurance' \| 'Multiple' |
| ApprovalStep | models/ICommitmentApproval.ts | 'PX' \| 'ComplianceManager' \| 'CFO' |
| PMPStatus | models/IProjectManagementPlan.ts | 'Draft' \| 'PendingSignatures' \| 'PendingApproval' \| 'Approved' \| 'Returned' \| 'Closed' |
| PMPSignatureStatus | models/IProjectManagementPlan.ts | 'Pending' \| 'Signed' \| 'Declined' |
| PMPSignatureType | models/IProjectManagementPlan.ts | 'Startup' \| 'Completion' |
| MonthlyReviewStatus | models/IMonthlyProjectReview.ts | 'NotStarted' \| 'InProgress' \| 'PendingPXReview' \| 'PXReviewComplete' \| 'PMRevising' \| 'PendingPXValidation' \| 'SubmittedToLeadership' \| 'FollowUpPending' \| 'Complete' |
| ChecklistResponseType | models/IStartupChecklist.ts | 'yesNoNA' \| 'yesNoWithComment' \| 'textInput' \| 'numeric' |
| ChecklistStatus | models/IStartupChecklist.ts | 'Conforming' \| 'Deficient' \| 'NA' \| 'Neutral' \| 'NoResponse' |
| MatrixAssignment | models/IResponsibilityMatrix.ts | 'X' \| 'Support' \| 'Sign-Off' \| 'Review' \| '' |
| OwnerContractParty | models/IResponsibilityMatrix.ts | 'O' \| 'A/E' \| 'C' \| '' |
| CriticalPathStatus | models/IProjectScheduleCriticalPath.ts | 'Active' \| 'Monitoring' \| 'Resolved' |
| QualityConcernStatus | models/IQualityConcerns.ts | 'Open' \| 'Monitoring' \| 'Resolved' \| 'Closed' |
| SafetyConcernSeverity | models/ISafetyConcerns.ts | 'Low' \| 'Medium' \| 'High' \| 'Critical' |
| SafetyConcernStatus | models/ISafetyConcerns.ts | 'Open' \| 'Monitoring' \| 'Resolved' \| 'Closed' |
| ContractStatus | models/IContractInfo.ts | 'Draft' \| 'In Review' \| 'Executed' |
| CloseoutItemStatus | models/ICloseoutItem.ts | 'Not Started' \| 'In Progress' \| 'Complete' |
| TurnoverItemStatus | models/ITurnoverItem.ts | 'Not Started' \| 'In Progress' \| 'Complete' |
| ProjectStatus | models/IActiveProject.ts | 'Precon' \| 'Construction' \| 'Final Payment' |
| SectorType | models/IActiveProject.ts | 'Commercial' \| 'Residential' |
| LessonCategory | models/ILessonsLearned.ts | 'Cost' \| 'Schedule' \| 'Quality' \| 'Safety' \| 'Communication' \| 'Subcontractor' \| 'Design' \| 'Client' \| 'Preconstruction' \| 'Other' |
| LessonImpact | models/ILessonsLearned.ts | 'Positive' \| 'Negative' \| 'Neutral' |
| EstimatingKickoffSection | models/IEstimatingKickoff.ts | 'managing' \| 'deliverables_standard' \| 'deliverables_nonstandard' |
| EstimatingKickoffStatus | models/IEstimatingKickoff.ts | 'yes' \| 'no' \| 'na' \| null |
| AutopsyAnswer | models/ILossAutopsy.ts | boolean \| null |
| HubNavLinkStatus | models/IProvisioningLog.ts | 'success' \| 'failed' \| 'not_applicable' |
| EnvironmentTier | models/IEnvironmentConfig.ts | 'dev' \| 'vetting' \| 'prod' |
| AssignmentType | models/IAssignmentMapping.ts | 'Estimator' \| 'Director' |

---

## §7 Service Methods

212 methods on IDataService. Source: `services/IDataService.ts`

| # | Method | Signature | Mock | SP | Hook Caller | Mock JSON |
|---|--------|-----------|------|-----|-------------|-----------|
| 1 | getLeads | (options?: IListQueryOptions) → Promise<IPagedResult<ILead>> | Impl | Impl | useLeads | leads.json |
| 2 | getLeadById | (id: number) → Promise<ILead \| null> | Impl | Impl | useLeads | leads.json |
| 3 | getLeadsByStage | (stage: Stage) → Promise<ILead[]> | Impl | Impl | useLeads | leads.json |
| 4 | createLead | (data: ILeadFormData) → Promise<ILead> | Impl | Impl | useLeads | leads.json |
| 5 | updateLead | (id: number, data: Partial<ILead>) → Promise<ILead> | Impl | Impl | useLeads, useWorkflow | leads.json |
| 6 | deleteLead | (id: number) → Promise<void> | Impl | Impl | useLeads | leads.json |
| 7 | searchLeads | (query: string) → Promise<ILead[]> | Impl | Impl | useLeads | leads.json |
| 8 | getScorecardByLeadId | (leadId: number) → Promise<IGoNoGoScorecard \| null> | Impl | Impl | useGoNoGo | scorecards.json |
| 9 | getScorecards | () → Promise<IGoNoGoScorecard[]> | Impl | Impl | useGoNoGo | scorecards.json |
| 10 | createScorecard | (data: Partial<IGoNoGoScorecard>) → Promise<IGoNoGoScorecard> | Impl | Impl | useGoNoGo | scorecards.json |
| 11 | updateScorecard | (id: number, data: Partial<IGoNoGoScorecard>) → Promise<IGoNoGoScorecard> | Impl | Impl | useGoNoGo | scorecards.json |
| 12 | submitGoNoGoDecision | (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) → Promise<void> | Impl | Impl | useGoNoGo | scorecards.json |
| 13 | getEstimatingRecords | (options?: IListQueryOptions) → Promise<IPagedResult<IEstimatingTracker>> | Impl | Impl | useEstimating | estimating.json |
| 14 | getEstimatingRecordById | (id: number) → Promise<IEstimatingTracker \| null> | Impl | Impl | useEstimating | estimating.json |
| 15 | getEstimatingByLeadId | (leadId: number) → Promise<IEstimatingTracker \| null> | Impl | Impl | useEstimating, useWorkflow | estimating.json |
| 16 | createEstimatingRecord | (data: Partial<IEstimatingTracker>) → Promise<IEstimatingTracker> | Impl | Impl | useEstimating | estimating.json |
| 17 | updateEstimatingRecord | (id: number, data: Partial<IEstimatingTracker>) → Promise<IEstimatingTracker> | Impl | Impl | useEstimating, useWorkflow | estimating.json |
| 18 | getCurrentPursuits | () → Promise<IEstimatingTracker[]> | Impl | Impl | useEstimating | estimating.json |
| 19 | getPreconEngagements | () → Promise<IEstimatingTracker[]> | Impl | Impl | useEstimating | estimating.json |
| 20 | getEstimateLog | () → Promise<IEstimatingTracker[]> | Impl | Impl | useEstimating | estimating.json |
| 21 | getCurrentUser | () → Promise<ICurrentUser> | Impl | Impl | AppContext | users.json |
| 22 | getRoles | () → Promise<IRole[]> | Impl | Impl | AppContext | users.json |
| 23 | updateRole | (id: number, data: Partial<IRole>) → Promise<IRole> | Impl | Impl | AdminPanel | users.json |
| 24 | getFeatureFlags | () → Promise<IFeatureFlag[]> | Impl | Impl | AppContext | featureFlags.json |
| 25 | updateFeatureFlag | (id: number, data: Partial<IFeatureFlag>) → Promise<IFeatureFlag> | Impl | Impl | AdminPanel | featureFlags.json |
| 26 | getCalendarAvailability | (emails: string[], startDate: string, endDate: string) → Promise<ICalendarAvailability[]> | Impl | Stub | useMeetings | calendarAvailability.json |
| 27 | createMeeting | (meeting: Partial<IMeeting>) → Promise<IMeeting> | Impl | Stub | useMeetings, useWorkflow | in-memory |
| 28 | getMeetings | (projectCode?: string) → Promise<IMeeting[]> | Impl | Stub | useMeetings | in-memory |
| 29 | sendNotification | (notification: Partial<INotification>) → Promise<INotification> | Impl | Stub | useNotifications, useWorkflow | in-memory |
| 30 | getNotifications | (projectCode?: string) → Promise<INotification[]> | Impl | Stub | useNotifications | in-memory |
| 31 | logAudit | (entry: Partial<IAuditEntry>) → Promise<void> | Impl | Impl | useWorkflow, various hooks | in-memory |
| 32 | getAuditLog | (entityType?: string, entityId?: string, startDate?: string, endDate?: string) → Promise<IAuditEntry[]> | Impl | Impl | AdminPanel | in-memory |
| 33 | purgeOldAuditEntries | (olderThanDays: number) → Promise<number> | Impl | Stub | AdminPanel | in-memory |
| 34 | triggerProvisioning | (leadId: number, projectCode: string, projectName: string, requestedBy: string) → Promise<IProvisioningLog> | Impl | Impl | GoNoGoScorecard | in-memory |
| 35 | getProvisioningStatus | (projectCode: string) → Promise<IProvisioningLog \| null> | Impl | Impl | ProvisioningStatus | in-memory |
| 36 | updateProvisioningLog | (projectCode: string, data: Partial<IProvisioningLog>) → Promise<IProvisioningLog> | Impl | Impl | — | in-memory |
| 37 | getProvisioningLogs | () → Promise<IProvisioningLog[]> | Impl | Impl | AdminPanel | in-memory |
| 38 | retryProvisioning | (projectCode: string, fromStep: number) → Promise<IProvisioningLog> | Impl | Impl | AdminPanel | in-memory |
| 39 | getTeamMembers | (projectCode: string) → Promise<ITeamMember[]> | Impl | Impl | useWorkflow | teamMembers.json |
| 40 | getDeliverables | (projectCode: string) → Promise<IDeliverable[]> | Impl | Impl | useWorkflow | deliverables.json |
| 41 | createDeliverable | (data: Partial<IDeliverable>) → Promise<IDeliverable> | Impl | Impl | useWorkflow | deliverables.json |
| 42 | updateDeliverable | (id: number, data: Partial<IDeliverable>) → Promise<IDeliverable> | Impl | Impl | useWorkflow | deliverables.json |
| 43 | getInterviewPrep | (leadId: number) → Promise<IInterviewPrep \| null> | Impl | Impl | useWorkflow | in-memory |
| 44 | saveInterviewPrep | (data: Partial<IInterviewPrep>) → Promise<IInterviewPrep> | Impl | Impl | useWorkflow | in-memory |
| 45 | getContractInfo | (projectCode: string) → Promise<IContractInfo \| null> | Impl | Impl | useWorkflow | in-memory |
| 46 | saveContractInfo | (data: Partial<IContractInfo>) → Promise<IContractInfo> | Impl | Impl | useWorkflow | in-memory |
| 47 | getTurnoverItems | (projectCode: string) → Promise<ITurnoverItem[]> | Impl | Impl | useWorkflow | turnoverItems.json |
| 48 | updateTurnoverItem | (id: number, data: Partial<ITurnoverItem>) → Promise<ITurnoverItem> | Impl | Impl | useWorkflow | turnoverItems.json |
| 49 | getCloseoutItems | (projectCode: string) → Promise<ICloseoutItem[]> | Impl | Impl | useWorkflow | closeoutItems.json |
| 50 | updateCloseoutItem | (id: number, data: Partial<ICloseoutItem>) → Promise<ICloseoutItem> | Impl | Impl | useWorkflow | closeoutItems.json |
| 51 | getLossAutopsy | (leadId: number) → Promise<ILossAutopsy \| null> | Impl | Impl | useWorkflow, usePostBidAutopsy | lossAutopsies.json |
| 52 | saveLossAutopsy | (data: Partial<ILossAutopsy>) → Promise<ILossAutopsy> | Impl | Impl | useWorkflow, usePostBidAutopsy | lossAutopsies.json |
| 53 | finalizeLossAutopsy | (leadId: number, data: Partial<ILossAutopsy>) → Promise<ILossAutopsy> | Impl | Impl | usePostBidAutopsy | lossAutopsies.json |
| 54 | isAutopsyFinalized | (leadId: number) → Promise<boolean> | Impl | Impl | usePostBidAutopsy | lossAutopsies.json |
| 55 | getAllLossAutopsies | () → Promise<ILossAutopsy[]> | Impl | Impl | usePostBidAutopsy | lossAutopsies.json |
| 56 | getStartupChecklist | (projectCode: string) → Promise<IStartupChecklistItem[]> | Impl | Impl | useStartupChecklist | startupChecklist.json |
| 57 | updateChecklistItem | (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) → Promise<IStartupChecklistItem> | Impl | Impl | useStartupChecklist | startupChecklist.json |
| 58 | addChecklistItem | (projectCode: string, item: Partial<IStartupChecklistItem>) → Promise<IStartupChecklistItem> | Impl | Impl | useStartupChecklist | startupChecklist.json |
| 59 | removeChecklistItem | (projectCode: string, itemId: number) → Promise<void> | Impl | Impl | useStartupChecklist | startupChecklist.json |
| 60 | getInternalMatrix | (projectCode: string) → Promise<IInternalMatrixTask[]> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 61 | updateInternalMatrixTask | (projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>) → Promise<IInternalMatrixTask> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 62 | addInternalMatrixTask | (projectCode: string, task: Partial<IInternalMatrixTask>) → Promise<IInternalMatrixTask> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 63 | removeInternalMatrixTask | (projectCode: string, taskId: number) → Promise<void> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 64 | getTeamRoleAssignments | (projectCode: string) → Promise<ITeamRoleAssignment[]> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 65 | updateTeamRoleAssignment | (projectCode: string, role: string, person: string, email?: string) → Promise<ITeamRoleAssignment> | Impl | Impl | useResponsibilityMatrix | internalMatrix.json |
| 66 | getOwnerContractMatrix | (projectCode: string) → Promise<IOwnerContractArticle[]> | Impl | Impl | useResponsibilityMatrix | ownerContractMatrix.json |
| 67 | updateOwnerContractArticle | (projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>) → Promise<IOwnerContractArticle> | Impl | Impl | useResponsibilityMatrix | ownerContractMatrix.json |
| 68 | addOwnerContractArticle | (projectCode: string, item: Partial<IOwnerContractArticle>) → Promise<IOwnerContractArticle> | Impl | Impl | useResponsibilityMatrix | ownerContractMatrix.json |
| 69 | removeOwnerContractArticle | (projectCode: string, itemId: number) → Promise<void> | Impl | Impl | useResponsibilityMatrix | ownerContractMatrix.json |
| 70 | getSubContractMatrix | (projectCode: string) → Promise<ISubContractClause[]> | Impl | Impl | useResponsibilityMatrix | subContractMatrix.json |
| 71 | updateSubContractClause | (projectCode: string, itemId: number, data: Partial<ISubContractClause>) → Promise<ISubContractClause> | Impl | Impl | useResponsibilityMatrix | subContractMatrix.json |
| 72 | addSubContractClause | (projectCode: string, item: Partial<ISubContractClause>) → Promise<ISubContractClause> | Impl | Impl | useResponsibilityMatrix | subContractMatrix.json |
| 73 | removeSubContractClause | (projectCode: string, itemId: number) → Promise<void> | Impl | Impl | useResponsibilityMatrix | subContractMatrix.json |
| 74 | getMarketingProjectRecord | (projectCode: string) → Promise<IMarketingProjectRecord \| null> | Impl | Impl | useMarketingRecord | marketingProjectRecords.json |
| 75 | createMarketingProjectRecord | (data: Partial<IMarketingProjectRecord>) → Promise<IMarketingProjectRecord> | Impl | Impl | useMarketingRecord | marketingProjectRecords.json |
| 76 | updateMarketingProjectRecord | (projectCode: string, data: Partial<IMarketingProjectRecord>) → Promise<IMarketingProjectRecord> | Impl | Impl | useMarketingRecord | marketingProjectRecords.json |
| 77 | getAllMarketingProjectRecords | () → Promise<IMarketingProjectRecord[]> | Impl | Impl | useMarketingRecord | marketingProjectRecords.json |
| 78 | getRiskCostManagement | (projectCode: string) → Promise<IRiskCostManagement \| null> | Impl | Stub | useRiskCostManagement | riskCostManagement.json |
| 79 | updateRiskCostManagement | (projectCode: string, data: Partial<IRiskCostManagement>) → Promise<IRiskCostManagement> | Impl | Stub | useRiskCostManagement | riskCostManagement.json |
| 80 | addRiskCostItem | (projectCode: string, item: Partial<IRiskCostItem>) → Promise<IRiskCostItem> | Impl | Stub | useRiskCostManagement | riskCostManagement.json |
| 81 | updateRiskCostItem | (projectCode: string, itemId: number, data: Partial<IRiskCostItem>) → Promise<IRiskCostItem> | Impl | Stub | useRiskCostManagement | riskCostManagement.json |
| 82 | getQualityConcerns | (projectCode: string) → Promise<IQualityConcern[]> | Impl | Stub | useQualityConcerns | qualityConcerns.json |
| 83 | addQualityConcern | (projectCode: string, concern: Partial<IQualityConcern>) → Promise<IQualityConcern> | Impl | Stub | useQualityConcerns | qualityConcerns.json |
| 84 | updateQualityConcern | (projectCode: string, concernId: number, data: Partial<IQualityConcern>) → Promise<IQualityConcern> | Impl | Stub | useQualityConcerns | qualityConcerns.json |
| 85 | getSafetyConcerns | (projectCode: string) → Promise<ISafetyConcern[]> | Impl | Stub | useSafetyConcerns | safetyConcerns.json |
| 86 | addSafetyConcern | (projectCode: string, concern: Partial<ISafetyConcern>) → Promise<ISafetyConcern> | Impl | Stub | useSafetyConcerns | safetyConcerns.json |
| 87 | updateSafetyConcern | (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) → Promise<ISafetyConcern> | Impl | Stub | useSafetyConcerns | safetyConcerns.json |
| 88 | getProjectSchedule | (projectCode: string) → Promise<IProjectScheduleCriticalPath \| null> | Impl | Stub | useProjectSchedule | projectScheduleCriticalPath.json |
| 89 | updateProjectSchedule | (projectCode: string, data: Partial<IProjectScheduleCriticalPath>) → Promise<IProjectScheduleCriticalPath> | Impl | Stub | useProjectSchedule | projectScheduleCriticalPath.json |
| 90 | addCriticalPathItem | (projectCode: string, item: Partial<ICriticalPathItem>) → Promise<ICriticalPathItem> | Impl | Stub | useProjectSchedule | projectScheduleCriticalPath.json |
| 91 | getSuperintendentPlan | (projectCode: string) → Promise<ISuperintendentPlan \| null> | Impl | Stub | useSuperintendentPlan | superintendentPlan.json |
| 92 | updateSuperintendentPlanSection | (projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>) → Promise<ISuperintendentPlanSection> | Impl | Stub | useSuperintendentPlan | superintendentPlan.json |
| 93 | createSuperintendentPlan | (projectCode: string, data: Partial<ISuperintendentPlan>) → Promise<ISuperintendentPlan> | Impl | Stub | useSuperintendentPlan | superintendentPlan.json |
| 94 | getLessonsLearned | (projectCode: string) → Promise<ILessonLearned[]> | Impl | Stub | useLessonsLearned | lessonsLearned.json |
| 95 | addLessonLearned | (projectCode: string, lesson: Partial<ILessonLearned>) → Promise<ILessonLearned> | Impl | Stub | useLessonsLearned, usePostBidAutopsy | lessonsLearned.json |
| 96 | updateLessonLearned | (projectCode: string, lessonId: number, data: Partial<ILessonLearned>) → Promise<ILessonLearned> | Impl | Stub | useLessonsLearned | lessonsLearned.json |
| 97 | getProjectManagementPlan | (projectCode: string) → Promise<IProjectManagementPlan \| null> | Impl | Stub | useProjectManagementPlan | projectManagementPlans.json |
| 98 | updateProjectManagementPlan | (projectCode: string, data: Partial<IProjectManagementPlan>) → Promise<IProjectManagementPlan> | Impl | Stub | useProjectManagementPlan | projectManagementPlans.json |
| 99 | submitPMPForApproval | (projectCode: string, submittedBy: string) → Promise<IProjectManagementPlan> | Impl | Stub | useProjectManagementPlan | projectManagementPlans.json |
| 100 | respondToPMPApproval | (projectCode: string, stepId: number, approved: boolean, comment: string) → Promise<IProjectManagementPlan> | Impl | Stub | useProjectManagementPlan | projectManagementPlans.json |
| 101 | signPMP | (projectCode: string, signatureId: number, comment: string) → Promise<IProjectManagementPlan> | Impl | Stub | useProjectManagementPlan | projectManagementPlans.json |
| 102 | getDivisionApprovers | () → Promise<IDivisionApprover[]> | Impl | Stub | useProjectManagementPlan | divisionApprovers.json |
| 103 | getPMPBoilerplate | () → Promise<IPMPBoilerplateSection[]> | Impl | Stub | useProjectManagementPlan | pmpBoilerplate.json |
| 104 | getMonthlyReviews | (projectCode: string) → Promise<IMonthlyProjectReview[]> | Impl | Stub | useMonthlyReview | monthlyProjectReviews.json |
| 105 | getMonthlyReview | (reviewId: number) → Promise<IMonthlyProjectReview \| null> | Impl | Stub | useMonthlyReview | monthlyProjectReviews.json |
| 106 | updateMonthlyReview | (reviewId: number, data: Partial<IMonthlyProjectReview>) → Promise<IMonthlyProjectReview> | Impl | Stub | useMonthlyReview | monthlyProjectReviews.json |
| 107 | createMonthlyReview | (data: Partial<IMonthlyProjectReview>) → Promise<IMonthlyProjectReview> | Impl | Stub | useMonthlyReview | monthlyProjectReviews.json |
| 108 | getEstimatingKickoff | (projectCode: string) → Promise<IEstimatingKickoff \| null> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 109 | getEstimatingKickoffByLeadId | (leadId: number) → Promise<IEstimatingKickoff \| null> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 110 | createEstimatingKickoff | (data: Partial<IEstimatingKickoff>) → Promise<IEstimatingKickoff> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 111 | updateEstimatingKickoff | (id: number, data: Partial<IEstimatingKickoff>) → Promise<IEstimatingKickoff> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 112 | updateKickoffItem | (kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>) → Promise<IEstimatingKickoffItem> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 113 | addKickoffItem | (kickoffId: number, item: Partial<IEstimatingKickoffItem>) → Promise<IEstimatingKickoffItem> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 114 | removeKickoffItem | (kickoffId: number, itemId: number) → Promise<void> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 173 | updateKickoffKeyPersonnel | (kickoffId: number, personnel: IKeyPersonnelEntry[]) → Promise<IEstimatingKickoff> | Impl | Stub | useEstimatingKickoff | estimatingKickoffs.json |
| 115 | getJobNumberRequests | (status?: JobNumberRequestStatus) → Promise<IJobNumberRequest[]> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 116 | getJobNumberRequestByLeadId | (leadId: number) → Promise<IJobNumberRequest \| null> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 117 | createJobNumberRequest | (data: Partial<IJobNumberRequest>) → Promise<IJobNumberRequest> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 118 | finalizeJobNumber | (requestId: number, jobNumber: string, assignedBy: string) → Promise<IJobNumberRequest> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 119 | getProjectTypes | () → Promise<IProjectType[]> | Impl | Stub | useJobNumberRequest | projectTypes.json |
| 120 | getStandardCostCodes | () → Promise<IStandardCostCode[]> | Impl | Stub | useJobNumberRequest | standardCostCodes.json |
| 121 | rekeyProjectCode | (oldCode: string, newCode: string, leadId: number) → Promise<void> | Impl | Impl | — | in-memory |
| 122 | getBuyoutEntries | (projectCode: string) → Promise<IBuyoutEntry[]> | Impl | Impl | useBuyoutLog | buyoutEntries.json |
| 123 | initializeBuyoutLog | (projectCode: string) → Promise<IBuyoutEntry[]> | Impl | Impl | useBuyoutLog | buyoutEntries.json |
| 124 | addBuyoutEntry | (projectCode: string, entry: Partial<IBuyoutEntry>) → Promise<IBuyoutEntry> | Impl | Impl | useBuyoutLog | buyoutEntries.json |
| 125 | updateBuyoutEntry | (projectCode: string, entryId: number, data: Partial<IBuyoutEntry>) → Promise<IBuyoutEntry> | Impl | Impl | useBuyoutLog | buyoutEntries.json |
| 126 | removeBuyoutEntry | (projectCode: string, entryId: number) → Promise<void> | Impl | Impl | useBuyoutLog | buyoutEntries.json |
| 127 | submitCommitmentForApproval | (projectCode: string, entryId: number, submittedBy: string) → Promise<IBuyoutEntry> | Impl | Impl | useCommitmentApproval | buyoutEntries.json |
| 128 | respondToCommitmentApproval | (projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean) → Promise<IBuyoutEntry> | Impl | Impl | useCommitmentApproval | buyoutEntries.json |
| 129 | getCommitmentApprovalHistory | (projectCode: string, entryId: number) → Promise<ICommitmentApproval[]> | Impl | Impl | useCommitmentApproval | buyoutEntries.json |
| 130 | uploadCommitmentDocument | (projectCode: string, entryId: number, file: File) → Promise<{fileId, fileName, fileUrl}> | Impl | Impl | BuyoutLogPage | buyoutEntries.json |
| 131 | getComplianceLog | (filters?: IComplianceLogFilter) → Promise<IComplianceEntry[]> | Impl | Impl | useComplianceLog | buyoutEntries.json |
| 132 | getComplianceSummary | () → Promise<IComplianceSummary> | Impl | Impl | useComplianceLog | buyoutEntries.json |
| 133 | getAppContextConfig | (siteUrl: string) → Promise<{RenderMode, AppTitle, VisibleModules} \| null> | Impl | Impl | AppContext | appContextConfig.json |
| 134 | getActiveProjects | (options?: IActiveProjectsQueryOptions) → Promise<IActiveProject[]> | Impl | Impl | useActiveProjects | generated |
| 135 | getActiveProjectById | (id: number) → Promise<IActiveProject \| null> | Impl | Impl | useActiveProjects | generated |
| 136 | syncActiveProject | (projectCode: string) → Promise<IActiveProject> | Impl | Impl | useActiveProjects | generated |
| 137 | updateActiveProject | (id: number, data: Partial<IActiveProject>) → Promise<IActiveProject> | Impl | Impl | useActiveProjects | generated |
| 138 | getPortfolioSummary | (filters?: IActiveProjectsFilter) → Promise<IPortfolioSummary> | Impl | Impl | useActiveProjects | generated |
| 139 | getPersonnelWorkload | (role?: 'PX' \| 'PM' \| 'Super') → Promise<IPersonnelWorkload[]> | Impl | Impl | useActiveProjects | generated |
| 140 | triggerPortfolioSync | () → Promise<void> | Impl | Impl | useActiveProjects | generated |
| 141 | syncDenormalizedFields | (leadId: number) → Promise<void> | Impl | Impl | — | in-memory |
| 142 | promoteToHub | (projectCode: string) → Promise<void> | Impl | Impl | — | in-memory |
| 143 | getWorkflowDefinitions | () → Promise<IWorkflowDefinition[]> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 144 | getWorkflowDefinition | (workflowKey: WorkflowKey) → Promise<IWorkflowDefinition \| null> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 145 | updateWorkflowStep | (workflowId: number, stepId: number, data: Partial<IWorkflowStep>) → Promise<IWorkflowStep> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 146 | addConditionalAssignment | (stepId: number, assignment: Partial<IConditionalAssignment>) → Promise<IConditionalAssignment> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 147 | updateConditionalAssignment | (assignmentId: number, data: Partial<IConditionalAssignment>) → Promise<IConditionalAssignment> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 148 | removeConditionalAssignment | (assignmentId: number) → Promise<void> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 149 | getWorkflowOverrides | (projectCode: string) → Promise<IWorkflowStepOverride[]> | Impl | Impl | useWorkflowDefinitions | workflowStepOverrides.json |
| 150 | setWorkflowStepOverride | (override: Partial<IWorkflowStepOverride>) → Promise<IWorkflowStepOverride> | Impl | Impl | useWorkflowDefinitions | workflowStepOverrides.json |
| 151 | removeWorkflowStepOverride | (overrideId: number) → Promise<void> | Impl | Impl | useWorkflowDefinitions | workflowStepOverrides.json |
| 152 | resolveWorkflowChain | (workflowKey: WorkflowKey, projectCode: string) → Promise<IResolvedWorkflowStep[]> | Impl | Impl | useWorkflowDefinitions | workflowDefinitions.json |
| 153 | getTurnoverAgenda | (projectCode: string) → Promise<ITurnoverAgenda \| null> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 154 | createTurnoverAgenda | (projectCode: string, leadId: number) → Promise<ITurnoverAgenda> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 155 | updateTurnoverAgenda | (projectCode: string, data: Partial<ITurnoverAgenda>) → Promise<ITurnoverAgenda> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 156 | updateTurnoverPrerequisite | (prerequisiteId: number, data: Partial<ITurnoverPrerequisite>) → Promise<ITurnoverPrerequisite> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 157 | updateTurnoverDiscussionItem | (itemId: number, data: Partial<ITurnoverDiscussionItem>) → Promise<ITurnoverDiscussionItem> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 158 | addTurnoverDiscussionAttachment | (itemId: number, file: File) → Promise<ITurnoverAttachment> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 159 | removeTurnoverDiscussionAttachment | (attachmentId: number) → Promise<void> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 160 | addTurnoverSubcontractor | (turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>) → Promise<ITurnoverSubcontractor> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 161 | updateTurnoverSubcontractor | (subId: number, data: Partial<ITurnoverSubcontractor>) → Promise<ITurnoverSubcontractor> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 162 | removeTurnoverSubcontractor | (subId: number) → Promise<void> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 163 | updateTurnoverExhibit | (exhibitId: number, data: Partial<ITurnoverExhibit>) → Promise<ITurnoverExhibit> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 164 | addTurnoverExhibit | (turnoverAgendaId: number, data: Partial<ITurnoverExhibit>) → Promise<ITurnoverExhibit> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 165 | removeTurnoverExhibit | (exhibitId: number) → Promise<void> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 166 | uploadTurnoverExhibitFile | (exhibitId: number, file: File) → Promise<{ fileUrl: string; fileName: string }> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 167 | signTurnoverAgenda | (signatureId: number, comment?: string) → Promise<ITurnoverSignature> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 168 | updateTurnoverEstimateOverview | (projectCode: string, data: Partial<ITurnoverEstimateOverview>) → Promise<ITurnoverEstimateOverview> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 169 | getTurnoverAgendaByLeadId | (leadId: number) → Promise<ITurnoverAgenda \| null> | Impl | Stub | useTurnoverAgenda | turnoverAgendas.json |
| 170 | getHubSiteUrl | () → Promise<string> | Impl | Impl | AdminPanel | in-memory |
| 171 | setHubSiteUrl | (url: string) → Promise<void> | Impl | Impl | AdminPanel | in-memory |
| 172 | getActionItems | (userEmail: string) → Promise<IActionInboxItem[]> | Impl | Stub | useActionInbox | aggregated |
| 173 | getPermissionTemplates | () → Promise<IPermissionTemplate[]> | Impl | Impl | usePermissionEngine | permissionTemplates.json |
| 174 | getPermissionTemplate | (id: number) → Promise<IPermissionTemplate \| null> | Impl | Impl | usePermissionEngine | permissionTemplates.json |
| 175 | createPermissionTemplate | (data: Partial<IPermissionTemplate>) → Promise<IPermissionTemplate> | Impl | Impl | usePermissionEngine | permissionTemplates.json |
| 176 | updatePermissionTemplate | (id: number, data: Partial<IPermissionTemplate>) → Promise<IPermissionTemplate> | Impl | Impl | usePermissionEngine | permissionTemplates.json |
| 177 | deletePermissionTemplate | (id: number) → Promise<void> | Impl | Impl | usePermissionEngine | permissionTemplates.json |
| 178 | getSecurityGroupMappings | () → Promise<ISecurityGroupMapping[]> | Impl | Impl | usePermissionEngine | securityGroupMappings.json |
| 179 | createSecurityGroupMapping | (data: Partial<ISecurityGroupMapping>) → Promise<ISecurityGroupMapping> | Impl | Impl | usePermissionEngine | securityGroupMappings.json |
| 180 | updateSecurityGroupMapping | (id: number, data: Partial<ISecurityGroupMapping>) → Promise<ISecurityGroupMapping> | Impl | Impl | usePermissionEngine | securityGroupMappings.json |
| 181 | getProjectTeamAssignments | (projectCode: string) → Promise<IProjectTeamAssignment[]> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 182 | getMyProjectAssignments | (userEmail: string) → Promise<IProjectTeamAssignment[]> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 183 | createProjectTeamAssignment | (data: Partial<IProjectTeamAssignment>) → Promise<IProjectTeamAssignment> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 184 | updateProjectTeamAssignment | (id: number, data: Partial<IProjectTeamAssignment>) → Promise<IProjectTeamAssignment> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 185 | removeProjectTeamAssignment | (id: number) → Promise<void> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 186 | resolveUserPermissions | (userEmail: string, projectCode: string \| null) → Promise<IResolvedPermissions> | Impl | Impl | AppContext, usePermissionEngine | aggregated |
| 187 | getAccessibleProjects | (userEmail: string) → Promise<string[]> | Impl | Impl | ProjectPicker, usePermissionEngine | projectTeamAssignments.json |
| 188 | getEnvironmentConfig | () → Promise<IEnvironmentConfig> | Impl | Impl | AppShell | environmentConfig.json |
| 189 | promoteTemplates | (fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string) → Promise<void> | Impl | Impl | PermissionTemplateEditor | permissionTemplates.json |
| 190 | getSectorDefinitions | () → Promise<ISectorDefinition[]> | Impl | Stub | useSectorDefinitions | sectorDefinitions.json |
| 191 | createSectorDefinition | (data: Partial<ISectorDefinition>) → Promise<ISectorDefinition> | Impl | Stub | AdminPanel | sectorDefinitions.json |
| 192 | updateSectorDefinition | (id: number, data: Partial<ISectorDefinition>) → Promise<ISectorDefinition> | Impl | Stub | AdminPanel | sectorDefinitions.json |
| 193 | createBdLeadFolder | (leadTitle: string, originatorName: string) → Promise<void> | Impl | Impl | LeadFormPage | in-memory |
| 194 | checkFolderExists | (path: string) → Promise<boolean> | Impl | Impl | — | in-memory |
| 195 | createFolder | (path: string) → Promise<void> | Impl | Impl | — | in-memory |
| 196 | renameFolder | (oldPath: string, newPath: string) → Promise<void> | Impl | Impl | useGoNoGo | in-memory |
| 197 | getAssignmentMappings | () → Promise<IAssignmentMapping[]> | Impl | Stub | useAssignmentMappings | assignmentMappings.json |
| 198 | createAssignmentMapping | (data: Partial<IAssignmentMapping>) → Promise<IAssignmentMapping> | Impl | Stub | useAssignmentMappings | assignmentMappings.json |
| 199 | updateAssignmentMapping | (id: number, data: Partial<IAssignmentMapping>) → Promise<IAssignmentMapping> | Impl | Stub | useAssignmentMappings | assignmentMappings.json |
| 200 | deleteAssignmentMapping | (id: number) → Promise<void> | Impl | Stub | useAssignmentMappings | assignmentMappings.json |
| 201 | setProjectSiteUrl | (siteUrl: string \| null) → void | Impl | Impl | AppContext | — |
| 202 | getAllProjectTeamAssignments | () → Promise<IProjectTeamAssignment[]> | Impl | Impl | usePermissionEngine | projectTeamAssignments.json |
| 203 | inviteToProjectSiteGroup | (projectCode: string, userEmail: string, role: string) → Promise<void> | Impl | Impl | usePermissionEngine | in-memory |

---

## §8 Routes

Source: `components/App.tsx`

| Route Path | Component | File | Requires Project | Permission Guard | Feature Gate |
|------------|-----------|------|-----------------|-----------------|--------------|
| / | DashboardPage | pages/hub/DashboardPage.tsx | No | — | — |
| /marketing | MarketingDashboard | pages/hub/MarketingDashboard.tsx | No | MARKETING_DASHBOARD_VIEW | — (page-level) |
| /preconstruction | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — | EstimatingTracker |
| /preconstruction/pipeline | PipelinePage | pages/hub/PipelinePage.tsx | No | — | PipelineDashboard |
| /preconstruction/pipeline/gonogo | PipelinePage | pages/hub/PipelinePage.tsx | No | — | PipelineDashboard |
| /preconstruction/gonogo | PipelinePage | pages/hub/PipelinePage.tsx | No | — | PipelineDashboard |
| /preconstruction/precon-tracker | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — | EstimatingTracker |
| /preconstruction/estimate-log | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — | EstimatingTracker |
| /preconstruction/kickoff-list | EstimatingKickoffList | pages/precon/EstimatingKickoffList.tsx | No | KICKOFF_VIEW | — |
| /preconstruction/autopsy-list | PostBidAutopsyList | pages/precon/PostBidAutopsyList.tsx | No | AUTOPSY_VIEW | LossAutopsy |
| /preconstruction/pursuit/:id | PursuitDetail | pages/precon/PursuitDetail.tsx | No | — | — |
| /preconstruction/pursuit/:id/kickoff | EstimatingKickoffPage | pages/precon/EstimatingKickoffPage.tsx | No | KICKOFF_VIEW | — |
| /preconstruction/pursuit/:id/interview | InterviewPrep | pages/project/InterviewPrep.tsx | No | — | — |
| /preconstruction/pursuit/:id/winloss | WinLossRecorder | pages/project/WinLossRecorder.tsx | No | — | — |
| /preconstruction/pursuit/:id/turnover | TurnoverToOps | pages/project/TurnoverToOps.tsx | No | — | TurnoverWorkflow |
| /preconstruction/pursuit/:id/autopsy | LossAutopsy | pages/project/LossAutopsy.tsx | No | — | LossAutopsy |
| /preconstruction/pursuit/:id/autopsy-form | PostBidAutopsyForm | pages/precon/PostBidAutopsyForm.tsx | No | AUTOPSY_VIEW | LossAutopsy |
| /preconstruction/pursuit/:id/deliverables | DeliverablesTracker | pages/project/DeliverablesTracker.tsx | No | — | — |
| /lead/new | LeadFormPage | pages/hub/LeadFormPage.tsx | No | — | LeadIntake |
| /lead/:id | LeadDetailPage | pages/hub/LeadDetailPage.tsx | No | — | — |
| /lead/:id/gonogo | GoNoGoScorecard | pages/hub/GoNoGoScorecard.tsx | No | — | GoNoGoScorecard |
| /lead/:id/gonogo/detail | GoNoGoDetail | pages/hub/GoNoGoDetail.tsx | No | — | GoNoGoScorecard |
| /lead/:id/schedule-gonogo | GoNoGoMeetingScheduler | pages/hub/GoNoGoMeetingScheduler.tsx | No | — | GoNoGoScorecard |
| /operations | ActiveProjectsDashboard | pages/hub/ActiveProjectsDashboard.tsx | No | ACTIVE_PROJECTS_VIEW | — (page-level) |
| /operations/project | ProjectDashboard | pages/project/ProjectDashboard.tsx | Yes | — | — |
| /operations/startup-checklist | ProjectStartupChecklist | pages/project/ProjectStartupChecklist.tsx | Yes | — | ProjectStartup |
| /operations/management-plan | ProjectManagementPlan | pages/project/pmp/ProjectManagementPlan.tsx | Yes | PMP_EDIT | ProjectManagementPlan |
| /operations/superintendent-plan | SuperintendentPlanPage | pages/project/SuperintendentPlanPage.tsx | Yes | — | — |
| /operations/responsibility | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — | ProjectStartup |
| /operations/responsibility/owner-contract | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — | ProjectStartup |
| /operations/responsibility/sub-contract | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — | ProjectStartup |
| /operations/closeout-checklist | CloseoutChecklist | pages/project/CloseoutChecklist.tsx | Yes | — | — |
| /operations/buyout-log | BuyoutLogPage | pages/project/BuyoutLogPage.tsx | Yes | BUYOUT_VIEW | — |
| /operations/contract-tracking | ContractTracking | pages/project/ContractTracking.tsx | Yes | — | — |
| /operations/compliance-log | ComplianceLog | pages/hub/ComplianceLog.tsx | No | COMPLIANCE_LOG_VIEW | — |
| /operations/risk-cost | RiskCostManagement | pages/project/RiskCostManagement.tsx | Yes | RISK_EDIT | — |
| /operations/schedule | ProjectScheduleCriticalPath | pages/project/ProjectScheduleCriticalPath.tsx | Yes | — | — |
| /operations/quality-concerns | QualityConcernsTracker | pages/project/QualityConcernsTracker.tsx | Yes | — | — |
| /operations/safety-concerns | SafetyConcernsTracker | pages/project/SafetyConcernsTracker.tsx | Yes | — | — |
| /operations/monthly-review | MonthlyProjectReview | pages/project/MonthlyProjectReview.tsx | Yes | — | MonthlyProjectReview |
| /operations/project-record | ProjectRecord | pages/project/ProjectRecord.tsx | Yes | — | — |
| /operations/lessons-learned | LessonsLearnedPage | pages/project/LessonsLearnedPage.tsx | Yes | — | — |
| /operations/gonogo | GoNoGoScorecard | pages/hub/GoNoGoScorecard.tsx | Yes | — | — |
| /job-request | JobNumberRequestForm | pages/hub/JobNumberRequestForm.tsx | No | — | — |
| /job-request/:leadId | JobNumberRequestForm | pages/hub/JobNumberRequestForm.tsx | No | — | — |
| /accounting-queue | AccountingQueuePage | pages/hub/AccountingQueuePage.tsx | No | ACCOUNTING_QUEUE_VIEW | — |
| /admin | AdminPanel | pages/hub/AdminPanel.tsx | No | ADMIN_CONFIG | — |
| /access-denied | AccessDeniedPage | pages/shared/AccessDeniedPage.tsx | No | — | — |
| * | NotFoundPage | (inline in App.tsx) | No | — | — |

---

## §9 Navigation Sidebar

Source: `components/layouts/NavigationSidebar.tsx`

```
Dashboard                                    [always visible, path: /]
─────────────────────────────────────────────
Marketing                                    [roles: Marketing, Executive Leadership]
  ├── Marketing Dashboard                    [/marketing, permission: marketing:dashboard:view, hubOnly, featureFlag: MarketingProjectRecord]
  └── Project Record                         [/operations/project-record, requiresProject, featureFlag: MarketingProjectRecord]
─────────────────────────────────────────────
Preconstruction                              [roles: BD Rep, Estimating Coord, Precon Team, Exec Leadership, Legal]
  ├── Estimating Dashboard                   [/preconstruction, hubOnly, featureFlag: EstimatingTracker]
  ├── Pipeline                               [/preconstruction/pipeline, hubOnly, featureFlag: PipelineDashboard]
  ├── Go/No-Go Tracker                       [/preconstruction/pipeline/gonogo, hubOnly, featureFlag: GoNoGoScorecard]
  ├── Precon Tracker                          [/preconstruction/precon-tracker, hubOnly, featureFlag: EstimatingTracker]
  ├── Estimate Log                            [/preconstruction/estimate-log, hubOnly, featureFlag: EstimatingTracker]
  ├── Post-Bid Autopsies                      [/preconstruction/autopsy-list, permission: autopsy:view, featureFlag: LossAutopsy]
  ├── New Lead                                [/lead/new, permission: lead:create, hubOnly, featureFlag: LeadIntake]
  ├── Job Number Request                      [/job-request, permission: job_number_request:create, hubOnly]
  ├── Lead Detail                             [/lead/:leadId, dynamic — only when project selected]
  └── Go/No-Go                               [/lead/:leadId/gonogo, dynamic — only when project selected]
─────────────────────────────────────────────
Accounting                                   [roles: Acct Mgr, Executive Leadership, Dept Director]
  └── Accounting Queue                        [/accounting-queue, permission: accounting_queue:view]
─────────────────────────────────────────────
Operations                                   [roles: Ops Team, Exec Leadership, Risk Mgmt, QC, Safety, IDS]
  ├── Active Projects                         [/operations, permission: active_projects:view, hubOnly, featureFlag: ExecutiveDashboard]
  ├── Compliance Log                          [/operations/compliance-log, permission: compliance_log:view, hubOnly]
  ├── [Project Manual]
  │   ├── Project Dashboard                   [/operations/project, requiresProject]
  │   ├── Startup Checklist                   [/operations/startup-checklist, requiresProject, featureFlag: ProjectStartup]
  │   ├── Management Plan                     [/operations/management-plan, requiresProject, featureFlag: ProjectManagementPlan]
  │   ├── Super's Plan                        [/operations/superintendent-plan, requiresProject]
  │   └── Responsibility                      [/operations/responsibility, requiresProject, featureFlag: ProjectStartup]
  ├── [Commitments]
  │   ├── Buyout Log                          [/operations/buyout-log, requiresProject, permission: buyout:view]
  │   ├── Contract Tracking                   [/operations/contract-tracking, requiresProject]
  │   └── Closeout Checklist                  [/operations/closeout-checklist, requiresProject]
  └── [Project Controls]
      ├── Risk & Cost                         [/operations/risk-cost, requiresProject]
      ├── Schedule                            [/operations/schedule, requiresProject]
      ├── Quality Concerns                    [/operations/quality-concerns, requiresProject]
      ├── Safety Concerns                     [/operations/safety-concerns, requiresProject]
      ├── Monthly Review                      [/operations/monthly-review, requiresProject, featureFlag: MonthlyProjectReview]
      └── Lessons Learned                     [/operations/lessons-learned, requiresProject]
─────────────────────────────────────────────
Admin                                        [roles: Executive Leadership]
  └── Admin Panel                             [/admin, permission: admin:config]
```

Items with `requiresProject` are disabled (grayed out) when no project is selected. Items with `permission` are hidden if user lacks that permission. Items with `hubOnly` are hidden when a project is selected (both hub-with-selection and project-site modes). Items with `featureFlag` are hidden if that feature flag is disabled (checked via `isFeatureEnabled()`). Dynamic items (Lead Detail, Go/No-Go) appear under Preconstruction only when `selectedProject?.leadId` is set.

---

## §10 RBAC Matrix

Source: `utils/permissions.ts`

Legend: **X** = has permission

| Permission | BD Rep | Est Coord | Acct Mgr | Precon | Ops | Exec | Dept Dir | Legal | Risk Mgmt | Marketing | QC | Safety | IDS | SP Admin |
|-----------|--------|-----------|----------|--------|-----|------|----------|-------|-----------|-----------|-----|--------|-----|----------|
| lead:create | X | | | | | | | | | | | | | X |
| lead:read | X | X | X | | | X | X | X | X | X | | | | X |
| lead:edit | X | | | | | | | | | | | | | X |
| lead:delete | X | | | | | | | | | | | | | X |
| gonogo:score:originator | X | | | | | | | | | | | | | X |
| gonogo:score:committee | | | | | | X | X | | | | | | | X |
| gonogo:submit | X | | | | | | | | | | | | | X |
| gonogo:decide | | | | | | X | X | | | | | | | X |
| gonogo:review | | | | | | X | X | | | | | | | X |
| gonogo:read | X | X | X | | | X | X | X | X | X | | | | X |
| precon:read | X | X | X | X | | X | X | X | X | X | X | X | X | X |
| precon:edit | | X | | X | | | | | | | | | | X |
| proposal:read | X | X | X | X | | X | X | X | X | X | X | X | X | X |
| proposal:edit | | X | | X | | | | | | X | | | | X |
| winloss:record | X | | | | | | | | | | | | | X |
| winloss:read | X | X | X | X | | X | X | X | X | X | X | X | X | X |
| contract:read | X | X | X | X | | X | X | X | X | X | X | X | X | X |
| contract:edit | | | | | | | | X | | | | | | X |
| contract:view:financials | | | X | | | X | X | | | | | | | X |
| turnover:read | X | X | X | X | X | X | X | X | X | X | X | X | X | X |
| turnover:edit | | | | | X | | | | | | | | | X |
| closeout:read | X | X | X | X | X | X | X | X | X | X | X | X | X | X |
| closeout:edit | | | | | X | | | | | | | | | X |
| estimating:read | X | X | X | X | | X | X | | | | | | | X |
| estimating:edit | | X | | | | | | | | | | | | X |
| precon:hub:view | X | X | | | | X | X | | | | | | | X |
| project:hub:view | | X | | | X | X | X | | | | | | | X |
| admin:roles | | | | | | X | | | | | | | | X |
| admin:flags | | | | | | X | | | | | | | | X |
| admin:config | | | | | | X | | | | | | | X | X |
| admin:connections | | | | | | X | | | | | | | | X |
| admin:provisioning | | | | | | X | | | | | | | | X |
| admin:assignments:manage | | | | | | X | | | | | | | | X |
| marketing:edit | X | | | | | | | | | X | | | | X |
| marketing:dashboard:view | X | | | | | X | X | | | X | | | | X |
| site:provision | X | | | | | | | | | | | | | X |
| meeting:schedule | X | | | | | X | X | | | | | | | X |
| meeting:read | X | X | X | X | X | X | X | X | X | X | X | X | X | X |
| startup:checklist:edit | | | | | X | | | | | | | | | X |
| startup:checklist:signoff | | | | | | X | X | | | | | | | X |
| matrix:edit | | | | | X | | | | | | | | | X |
| projectrecord:edit | X | | | | | | | | | X | | | | X |
| projectrecord:ops:edit | | | | | X | | | | | | | | | X |
| pmp:edit | | | | | X | | | | | | | | | X |
| pmp:approve | | | | | | X | X | | | | | | | X |
| pmp:final:approve | | | | | | X | X | | | | | | | X |
| pmp:sign | | | | | X | X | X | | | | | | | X |
| risk:edit | | | | | X | | | | X | | | | | X |
| quality:edit | | | | | X | | | | | | X | | | X |
| safety:edit | | | | | X | | | | | | | | | X |
| schedule:edit | | | | | X | | | | | | | | | X |
| superintendent:plan:edit | | | | | X | | | | | | | | | X |
| lessons:edit | | | | | X | | | | | | | | | X |
| monthly:review:pm | | | | | X | | | | | | | | | X |
| monthly:review:px | | | | | | X | X | | | | | | | X |
| monthly:review:create | | | | | | X | X | | | | | | | X |
| job_number_request:create | | X | | | | | | | | | | | | X |
| job_number_request:finalize | | | X | | | | | | | | | | | X |
| accounting_queue:view | | | X | | | | | | | | | | | X |
| kickoff:view | X | X | | X | | X | X | | | | | | | X |
| kickoff:edit | | X | | | | X | X | | | | | | | X |
| kickoff:template:edit | | X | | | | X | X | | | | | | | X |
| autopsy:view | X | X | | X | | X | X | | | | | | | X |
| autopsy:create | X | X | | | | X | X | | | | | | | X |
| autopsy:edit | X | X | | | | X | X | | | | | | | X |
| autopsy:schedule | X | X | | | | X | X | | | | | | | X |
| buyout:view | | | | X | X | X | X | | | | | | | X |
| buyout:edit | | | | | X | X | X | | | | | | | X |
| buyout:manage | | | | | X | | | | | | | | | X |
| commitment:submit | | | | | X | | | | | | | | | X |
| commitment:approve:px | | | | | | X | X | | | | | | | X |
| commitment:approve:compliance | | | | | | | | | X | | | | | X |
| commitment:approve:cfo | | | | | | X | X | | | | | | | X |
| commitment:escalate | | | | | | X | X | X | | | | | | X |
| active_projects:view | | | | | X | X | X | | | | | | | X |
| active_projects:sync | | | | | | X | X | | | | | | | X |
| compliance_log:view | | | | | X | X | X | X | | | | | | X |
| workflow:manage | | | | | | X | | | | | | | | X |
| turnover:agenda:edit | | X | | X | X | X | X | | | | | | | X |
| turnover:sign | | X | | | X | X | X | | | | | | | X |
| permission:templates:manage | | | | | | X | | | | | | | X | X |
| permission:project_team:manage | | | | | | X | | | | | | | X | X |
| permission:project_team:view | | | | | | X | X | | | | | | X | X |

### NAV_GROUP_ROLES

| Nav Group | Roles That Can See |
|-----------|-------------------|
| Marketing | Marketing, BD Representative, Executive Leadership, Department Director, SharePoint Admin |
| Preconstruction | BD Representative, Estimating Coordinator, Preconstruction Team, Executive Leadership, Department Director, Legal, SharePoint Admin |
| Operations | Operations Team, Executive Leadership, Department Director, Risk Management, Quality Control, Safety, IDS, SharePoint Admin |
| Accounting | Accounting Manager, Executive Leadership, Department Director, SharePoint Admin |
| Admin | Executive Leadership, SharePoint Admin |

---

## §11 Feature Flags

Source: `mock/featureFlags.json`

| Flag Name | ID | DisplayName | Default | Category | What It Gates |
|-----------|-----|-------------|---------|----------|---------------|
| LeadIntake | 1 | Lead Intake | true | Core Platform | Core lead intake feature |
| GoNoGoScorecard | 2 | Go/No-Go Scorecard | true | Core Platform | Go/No-Go scoring interface |
| AutoSiteProvisioning | 3 | Automatic Site Provisioning | true | Infrastructure | Automatic SP site provisioning |
| MeetingScheduler | 4 | Meeting Scheduler | true | Preconstruction | Calendar meeting scheduler |
| PipelineDashboard | 5 | Pipeline Dashboard | true | Core Platform | Pipeline visualization |
| TurnoverWorkflow | 6 | Turnover Workflow | true | Project Execution | Turnover to ops workflow |
| LossAutopsy | 7 | Post-Bid Loss Autopsy | true | Preconstruction | Loss autopsy module |
| EstimatingTracker | 8 | Estimating Tracker | true | Core Platform | Estimating tracker |
| UnanetIntegration | 9 | Unanet ERP Integration | false | Integrations | Unanet ERP integration (target: 2026-06-01) |
| SageIntegration | 10 | Sage 300 Integration | false | Integrations | Sage 300 accounting (target: 2026-06-01) |
| DocumentCrunchIntegration | 11 | Document Crunch AI Review | false | Integrations | AI contract review (target: 2026-09-01) |
| EstimatingModule | 12 | Full Estimating Module | false | Integrations | Full estimating module (target: 2026-12-01) |
| BudgetSync | 13 | Budget Sync | false | Integrations | Budget sync with accounting |
| ExecutiveDashboard | 14 | Executive Dashboard | true | Core Platform | Executive dashboard |
| DualNotifications | 15 | Dual Notifications (Email + Teams) | false | Infrastructure | Send both email and Teams notifications |
| AuditTrail | 16 | Audit Trail | false | Infrastructure | Detailed audit trail logging |
| OfflineSupport | 17 | Offline Support | false | Infrastructure | Offline mode with queue sync |
| ProjectStartup | 18 | Project Startup | true | Project Execution | Startup checklist and responsibility matrices |
| MarketingProjectRecord | 19 | Marketing Project Record | true | Project Execution | Marketing project record and dashboard |
| ProjectManagementPlan | 20 | Project Management Plan | true | Project Execution | PMP and operational modules |
| MonthlyProjectReview | 21 | Monthly Project Review | true | Project Execution | Monthly project review |
| WorkflowDefinitions | 22 | Workflow Definitions | true | Preconstruction | Workflow definition configuration |
| PermissionEngine | 23 | Permission Engine | true | Infrastructure | Permission engine: template-based authorization, project access scoping |

---

## §12 Mock Data Files

Source: `mock/`

| JSON File | Entity Type | Record Count | Project Codes |
|-----------|-------------|-------------|---------------|
| appContextConfig.json | App context configs | 3 | N/A |
| assignmentMappings.json | IAssignmentMapping | 4 | N/A |
| buyoutEntries.json | IBuyoutEntry | 15 | 25-042-01 |
| calendarAvailability.json | ICalendarAvailability | 7 | N/A |
| closeoutItems.json | ICloseoutItem | 15 | 25-042-01 |
| deliverables.json | IDeliverable | 10 | 25-042-01 |
| divisionApprovers.json | IDivisionApprover | 2 | N/A |
| estimating.json | IEstimatingTracker | 23 | 25-038-01, 25-035-01, 25-041-01, 25-039-01, 25-033-01, 26-004-01, 26-005-01, 25-030-01, 25-028-01, 25-012-01, 24-052-01, 24-042-01, 24-078-01, 24-008-01, 25-022-01, 25-025-01, 25-019-01, 25-015-01, 25-020-01, 25-027-01, 26-001-01, 25-018-01, 25-010-01 |
| estimatingKickoffs.json | IEstimatingKickoff | 1 | 25-042-01 |
| featureFlags.json | IFeatureFlag (with Category) | 23 | N/A |
| internalMatrix.json | IInternalMatrixTask + ITeamRoleAssignment + IRecurringCalendarItem | 100 | 25-042-01 |
| jobNumberRequests.json | IJobNumberRequest | 3 | N/A (TempProjectCode: 25-041-01) |
| leads.json | ILead | 29 | 25-038-01, 25-035-01, 25-041-01, 25-039-01, 25-033-01, 25-030-01, 25-028-01, 25-012-01, 24-078-01, 24-052-01, 24-042-01, 24-008-01, 23-065-01, 25-042-01 |
| lessonsLearned.json | ILessonLearned | 12 | 25-042-01, 25-115-01, 24-089-01 |
| lossAutopsies.json | ILossAutopsy | 1 | N/A |
| marketingProjectRecords.json | IMarketingProjectRecord | 4 | 25-042-01, 25-115-01, 25-200-01, 24-089-01 |
| monthlyProjectReviews.json | IMonthlyProjectReview | 4 | 25-042-01, 25-115-01 |
| ownerContractMatrix.json | IOwnerContractArticle | 20 | 25-042-01 |
| pmpBoilerplate.json | IPMPBoilerplateSection | 9 | N/A |
| projectManagementPlans.json | IProjectManagementPlan | 3 | 25-042-01, 25-115-01, 24-089-01 |
| projectScheduleCriticalPath.json | IProjectScheduleCriticalPath | 2 | 25-042-01, 25-115-01 |
| projectTypes.json | IProjectType | 20 | N/A |
| qualityConcerns.json | IQualityConcern | 8 | 25-042-01, 25-115-01 |
| riskCostManagement.json | IRiskCostManagement | 2 | 25-042-01, 25-115-01 |
| safetyConcerns.json | ISafetyConcern | 7 | 25-042-01, 25-115-01 |
| sectorDefinitions.json | ISectorDefinition | 12 | N/A |
| scorecards.json | IGoNoGoScorecard | 10 | 25-038-01, 25-035-01 |
| standardCostCodes.json | IStandardCostCode | 24 | N/A |
| startupChecklist.json | IStartupChecklistItem | 55 | 25-042-01 |
| subContractMatrix.json | ISubContractClause | 20 | 25-042-01 |
| superintendentPlan.json | ISuperintendentPlan | 2 | 25-042-01, 25-115-01 |
| teamMembers.json | ITeamMember | 10 | 25-042-01 |
| templateRegistry.json | Template definitions | 12 | N/A |
| turnoverAgendas.json | ITurnoverAgenda (flat) | 2 agendas + child arrays | 25-042-01, 25-115-01 |
| turnoverItems.json | ITurnoverItem | 14 | 25-042-01 |
| users.json | IRole + ICurrentUser | 25 | N/A |
| workflowDefinitions.json | IWorkflowDefinition | 5 | N/A |
| workflowStepOverrides.json | IWorkflowStepOverride | 0 | N/A |
| permissionTemplates.json | IPermissionTemplate | 9 | N/A |
| securityGroupMappings.json | ISecurityGroupMapping | 9 | N/A |
| projectTeamAssignments.json | IProjectTeamAssignment | 15 | 25-042-01, 25-115-01 |
| environmentConfig.json | IEnvironmentConfig | 1 | N/A |

---

## §13 Key Constants

Source: `utils/constants.ts`, `theme/tokens.ts`

### HUB_LISTS

```typescript
{
  LEADS_MASTER: 'Leads_Master',
  APP_ROLES: 'App_Roles',
  FEATURE_FLAGS: 'Feature_Flags',
  APP_CONTEXT_CONFIG: 'App_Context_Config',
  AUDIT_LOG: 'Audit_Log',
  AUDIT_LOG_ARCHIVE: 'Audit_Log_Archive',
  PROVISIONING_LOG: 'Provisioning_Log',
  ESTIMATING_TRACKER: 'Estimating_Tracker',
  GONOGO_SCORECARD: 'GoNoGo_Scorecard',
  GNG_COMMITTEE: 'GNG_Committee',
  ACTIVE_PROJECTS_PORTFOLIO: 'Active_Projects_Portfolio',
  TEMPLATE_REGISTRY: 'Template_Registry',
  REGIONS: 'Regions',
  SECTORS: 'Sectors',
  AUTOPSY_ATTENDEES: 'Autopsy_Attendees',
  JOB_NUMBER_REQUESTS: 'Job_Number_Requests',
  ESTIMATING_KICKOFFS: 'Estimating_Kickoffs',
  ESTIMATING_KICKOFF_ITEMS: 'Estimating_Kickoff_Items',
  LOSS_AUTOPSIES: 'Loss_Autopsies',
  MARKETING_PROJECT_RECORDS: 'Marketing_Project_Records',
  LESSONS_LEARNED_HUB: 'Lessons_Learned_Hub',
  PROJECT_TYPES: 'Project_Types',
  STANDARD_COST_CODES: 'Standard_Cost_Codes',
  WORKFLOW_DEFINITIONS: 'Workflow_Definitions',
  WORKFLOW_STEPS: 'Workflow_Steps',
  WORKFLOW_CONDITIONAL_ASSIGNMENTS: 'Workflow_Conditional_Assignments',
  WORKFLOW_STEP_OVERRIDES: 'Workflow_Step_Overrides',
  PERMISSION_TEMPLATES: 'Permission_Templates',
  SECURITY_GROUP_MAPPINGS: 'Security_Group_Mappings',
  PROJECT_TEAM_ASSIGNMENTS: 'Project_Team_Assignments',
  SECTOR_DEFINITIONS: 'Sector_Definitions',
  ASSIGNMENT_MAPPINGS: 'Assignment_Mappings',
}
```

### PROJECT_LISTS

```typescript
{
  PROJECT_INFO: 'Project_Info',
  TEAM_MEMBERS: 'Team_Members',
  DELIVERABLES: 'Deliverables',
  ACTION_ITEMS: 'Action_Items',
  TURNOVER_CHECKLIST: 'Turnover_Checklist',
  BUYOUT_LOG: 'Buyout_Log',
  COMMITMENT_APPROVALS: 'Commitment_Approvals',
  STARTUP_CHECKLIST: 'Startup_Checklist',
  CHECKLIST_ACTIVITY_LOG: 'Checklist_Activity_Log',
  INTERNAL_MATRIX: 'Internal_Matrix',
  TEAM_ROLE_ASSIGNMENTS: 'Team_Role_Assignments',
  OWNER_CONTRACT_MATRIX: 'Owner_Contract_Matrix',
  SUB_CONTRACT_MATRIX: 'Sub_Contract_Matrix',
  RISK_COST_MANAGEMENT: 'Risk_Cost_Management',
  RISK_COST_ITEMS: 'Risk_Cost_Items',
  QUALITY_CONCERNS: 'Quality_Concerns',
  SAFETY_CONCERNS: 'Safety_Concerns',
  PROJECT_SCHEDULE: 'Project_Schedule',
  CRITICAL_PATH_ITEMS: 'Critical_Path_Items',
  SUPERINTENDENT_PLAN: 'Superintendent_Plan',
  SUPERINTENDENT_PLAN_SECTIONS: 'Superintendent_Plan_Sections',
  LESSONS_LEARNED: 'Lessons_Learned',
  PMP: 'Project_Management_Plans',
  PMP_SIGNATURES: 'PMP_Signatures',
  PMP_APPROVAL_CYCLES: 'PMP_Approval_Cycles',
  PMP_APPROVAL_STEPS: 'PMP_Approval_Steps',
  MONTHLY_REVIEWS: 'Monthly_Reviews',
  MONTHLY_CHECKLIST_ITEMS: 'Monthly_Checklist_Items',
  MONTHLY_FOLLOW_UPS: 'Monthly_Follow_Ups',
  CLOSEOUT_ITEMS: 'Closeout_Items',
  MARKETING_PROJECT_RECORD: 'Marketing_Project_Record',
  CONTRACT_INFO: 'Contract_Info',
  INTERVIEW_PREP: 'Interview_Prep',
  TURNOVER_AGENDAS: 'Turnover_Agendas',
  TURNOVER_PREREQUISITES: 'Turnover_Prerequisites',
  TURNOVER_DISCUSSION_ITEMS: 'Turnover_Discussion_Items',
  TURNOVER_SUBCONTRACTORS: 'Turnover_Subcontractors',
  TURNOVER_EXHIBITS: 'Turnover_Exhibits',
  TURNOVER_SIGNATURES: 'Turnover_Signatures',
  TURNOVER_ATTACHMENTS: 'Turnover_Attachments',
}
```

### HBC_COLORS

```typescript
{
  // Primary brand
  navy: '#1B2A4A',
  orange: '#E87722',
  white: '#FFFFFF',
  // Secondary
  lightNavy: '#2C3E6B',
  darkNavy: '#0F1A2E',
  lightOrange: '#F5A623',
  darkOrange: '#C45E0A',
  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  // Score tiers
  scoreTierHigh: '#10B981',   // 69+
  scoreTierMid: '#F59E0B',    // 55-68
  scoreTierLow: '#EF4444',    // Below 55
}
```

### ROUTES

```typescript
{
  DASHBOARD: '/',
  MARKETING: '/marketing',
  PRECON: '/preconstruction',
  PRECON_GONOGO: '/preconstruction/gonogo',
  PRECON_PIPELINE: '/preconstruction/pipeline',
  PRECON_PIPELINE_GONOGO: '/preconstruction/pipeline/gonogo',
  PRECON_TRACKING: '/preconstruction/precon-tracker',
  PRECON_ESTIMATE_LOG: '/preconstruction/estimate-log',
  PRECON_KICKOFF_LIST: '/preconstruction/kickoff-list',
  PRECON_AUTOPSY_LIST: '/preconstruction/autopsy-list',
  PRECON_PURSUIT: '/preconstruction/pursuit/:id',
  PRECON_PURSUIT_KICKOFF: '/preconstruction/pursuit/:id/kickoff',
  PRECON_PURSUIT_INTERVIEW: '/preconstruction/pursuit/:id/interview',
  PRECON_PURSUIT_WINLOSS: '/preconstruction/pursuit/:id/winloss',
  PRECON_PURSUIT_TURNOVER: '/preconstruction/pursuit/:id/turnover',
  PRECON_PURSUIT_AUTOPSY: '/preconstruction/pursuit/:id/autopsy',
  PRECON_PURSUIT_AUTOPSY_FORM: '/preconstruction/pursuit/:id/autopsy-form',
  PRECON_PURSUIT_DELIVERABLES: '/preconstruction/pursuit/:id/deliverables',
  LEAD_NEW: '/lead/new',
  LEAD_DETAIL: '/lead/:id',
  LEAD_GONOGO: '/lead/:id/gonogo',
  LEAD_GONOGO_DETAIL: '/lead/:id/gonogo/detail',
  LEAD_SCHEDULE_GONOGO: '/lead/:id/schedule-gonogo',
  OPERATIONS: '/operations',
  OPS_PROJECT: '/operations/project',
  OPS_STARTUP_CHECKLIST: '/operations/startup-checklist',
  OPS_MANAGEMENT_PLAN: '/operations/management-plan',
  OPS_SUPERINTENDENT_PLAN: '/operations/superintendent-plan',
  OPS_RESPONSIBILITY: '/operations/responsibility',
  OPS_CLOSEOUT: '/operations/closeout-checklist',
  OPS_BUYOUT: '/operations/buyout-log',
  OPS_CONTRACT: '/operations/contract-tracking',
  OPS_COMPLIANCE: '/operations/compliance-log',
  OPS_RISK_COST: '/operations/risk-cost',
  OPS_SCHEDULE: '/operations/schedule',
  OPS_QUALITY: '/operations/quality-concerns',
  OPS_SAFETY: '/operations/safety-concerns',
  OPS_MONTHLY_REVIEW: '/operations/monthly-review',
  OPS_PROJECT_RECORD: '/operations/project-record',
  OPS_LESSONS: '/operations/lessons-learned',
  OPS_GONOGO: '/operations/gonogo',
  JOB_REQUEST: '/job-request',
  JOB_REQUEST_LEAD: '/job-request/:leadId',
  ACCOUNTING_QUEUE: '/accounting-queue',
  ADMIN: '/admin',
  ACCESS_DENIED: '/access-denied',
}
```

### Other Constants

```typescript
APP_VERSION = '1.0.0'
CACHE_TTL_MS = 900000  // 15 minutes
SCORE_THRESHOLDS = { HIGH: 69, MID: 55 }
DEFAULT_HUB_SITE_URL = 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral'
OFFLINE_RETRY_INTERVAL_MS = 30000
MAX_OFFLINE_QUEUE_SIZE = 100
FILE_CHUNK_SIZE = 10485760  // 10MB

BREAKPOINTS = { mobile: 768, tablet: 1024, desktop: 1024 }
SPACING = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' }

BD_LEADS_SITE_URL = 'https://hedrickbrotherscom.sharepoint.com/sites/PXPortfolioDashboard'
BD_LEADS_LIBRARY = 'BD Leads'
BD_LEADS_SUBFOLDERS = ['Client Information', 'Correspondence', 'Proposal Documents', 'Site and Project Plans', 'Financial Estimates', 'Evaluations and Scorecards', 'Contracts and Legal', 'Media and Visuals', 'Archives']
```

### UI Constants (theme/tokens.ts)

```typescript
ELEVATION = { level1: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)', level2: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)', level3: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)', level4: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)' }
TRANSITION = { fast: '150ms ease', normal: '250ms ease', slow: '350ms ease' }
```

---

## §14 File Naming & Conventions

### Naming Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Component (page) | PascalCase descriptive | `EstimatingDashboard.tsx`, `BuyoutLogPage.tsx` |
| Component (shared) | PascalCase noun | `DataTable.tsx`, `KPICard.tsx` |
| Model | `I` + PascalCase entity | `ILead.ts`, `IBuyoutEntry.ts` |
| Hook | `use` + PascalCase | `useLeads.ts`, `useBuyoutLog.ts` |
| Service | PascalCase + `Service` | `MockDataService.ts`, `AuditService.ts` |
| Mock data | camelCase entity plural | `leads.json`, `buyoutEntries.json` |
| Utility | camelCase descriptive | `permissions.ts`, `formatters.ts` |
| Barrel export | `index.ts` | Every directory has one |

### New Feature Workflow (Standard Sequence)

Steps 1-6 modify `packages/hbc-sp-services/` (the shared library). Steps 7-12 modify the app (`src/`).

1. **Model** — Create `packages/hbc-sp-services/src/models/INewEntity.ts`, add to `models/index.ts` barrel
2. **Mock JSON** — Create `packages/hbc-sp-services/src/mock/newEntities.json` with sample data
3. **Service Methods** — Add methods to `packages/hbc-sp-services/src/services/IDataService.ts`
4. **MockDataService** — Implement in `packages/hbc-sp-services/src/services/MockDataService.ts`
5. **SharePointDataService** — Add stubs in `packages/hbc-sp-services/src/services/SharePointDataService.ts`
6. **Column Mappings** — Add to `packages/hbc-sp-services/src/services/columnMappings.ts` if new SP list
7. **Hook** — Create `src/.../components/hooks/useNewEntity.ts`, add to `hooks/index.ts` barrel
8. **Component** — Create page component in appropriate `pages/` subdirectory, add to its `index.ts`
9. **Route** — Add route in `components/App.tsx`
10. **Navigation** — Add nav item in `components/layouts/NavigationSidebar.tsx`
11. **Constants** — Add list name to `HUB_LISTS` or `PROJECT_LISTS` in `packages/hbc-sp-services/src/utils/constants.ts`
12. **Permissions** — Add permission keys to `packages/hbc-sp-services/src/utils/permissions.ts`
13. **Barrel** — If adding new util exports, add to `packages/hbc-sp-services/src/index.ts`
14. **Update CLAUDE.md** — Update all affected sections

---

## §15 Current Phase Status

| Phase | Summary | Files Added | Files Modified |
|-------|---------|-------------|---------------|
| 1 | Lead intake, Go/No-Go scorecard, stage engine | ILead, IGoNoGoScorecard, enums, LeadFormPage, LeadDetailPage, GoNoGoScorecard, DashboardPage, PipelinePage | App.tsx, IDataService, MockDataService |
| 2 | Estimating tracker, pipeline, search | IEstimatingTracker, EstimatingDashboard, PipelinePage, SearchBar | constants.ts, permissions.ts |
| 3 | RBAC, feature flags, admin panel | IRole, IFeatureFlag, permissions.ts, AdminPanel, guards/* | AppContext.tsx, NavigationSidebar.tsx |
| 4 | Site provisioning, audit service | IProvisioningLog, IAuditEntry, ProvisioningService, AuditService, PowerAutomateService | GoNoGoScorecard (trigger), MockDataService |
| 5 | Meeting scheduler, notifications, calendar | IMeeting, INotification, GraphService, NotificationService, MeetingScheduler, GoNoGoMeetingScheduler | IDataService (meeting/notification methods) |
| 6 | Pursuit workflow: deliverables, interview, win/loss, turnover, closeout, loss autopsy | IDeliverable, IActionItem, IContractInfo, ITurnoverItem, ICloseoutItem, IInterviewPrep, ILossAutopsy, useWorkflow, PursuitDetail, InterviewPrep, WinLossRecorder, TurnoverToOps, CloseoutChecklist, LossAutopsy, DeliverablesTracker | App.tsx (pursuit routes), NavigationSidebar |
| 7 | Estimating kickoff, post-bid autopsy | IEstimatingKickoff, EstimatingKickoffPage, EstimatingKickoffList, PostBidAutopsyForm, PostBidAutopsyList | App.tsx, NavigationSidebar, IDataService |
| 8 | Job number requests, accounting queue, active projects portfolio | IJobNumberRequest, IActiveProject, JobNumberRequestForm, AccountingQueuePage, ActiveProjectsDashboard | constants.ts, permissions.ts, NavigationSidebar |
| 9 | Startup checklist, responsibility matrices, marketing project record/dashboard | IStartupChecklist, IResponsibilityMatrix, IMarketingProjectRecord, ProjectStartupChecklist, ResponsibilityMatrices, InternalResponsibilityMatrix, OwnerContractMatrix, SubContractMatrix, ProjectRecord, MarketingDashboard | App.tsx, NavigationSidebar, IDataService, MockDataService |
| 10 | PMP, operational modules (risk/cost, quality, safety, schedule, super's plan, lessons learned, monthly review) | IProjectManagementPlan, IRiskCostManagement, IQualityConcerns, ISafetyConcerns, IProjectScheduleCriticalPath, ISuperintendentPlan, ILessonsLearned, IMonthlyProjectReview, ProjectManagementPlan, pmp/*, RiskCostManagement, QualityConcernsTracker, SafetyConcernsTracker, ProjectScheduleCriticalPath, SuperintendentPlanPage, LessonsLearnedPage, MonthlyProjectReview, useMonthlyReview | App.tsx, NavigationSidebar, IDataService, MockDataService, permissions.ts |
| 11 | Data Strategy Refactor — flattened mock data for parent/child SP list alignment, columnMappings.ts (1267 lines of SP column definitions for all lists), docs/DATA_ARCHITECTURE.md, docs/PERMISSION_STRATEGY.md | columnMappings.ts, DATA_ARCHITECTURE.md, PERMISSION_STRATEGY.md | MockDataService (refactored mock JSON structure), SharePointDataService (column mapping imports) |
| 12 | Buyout log, commitment approval, compliance log | IBuyoutEntry, ICommitmentApproval, IComplianceSummary, BuyoutLogPage, CommitmentApprovalPanel, CommitmentForm, ComplianceLog, ContractTracking | App.tsx, NavigationSidebar, IDataService, MockDataService, permissions.ts, riskEngine.ts |
| 13 | Active projects portfolio enhancements, project dashboard | ProjectDashboard, useActiveProjects enhancements | App.tsx |
| 14 | Admin Panel Workflow Definitions — 4 configurable approval-chain workflows (Go/No-Go, PMP, Monthly Review, Commitment), AdminPanel Workflows tab, workflow step editor, conditional assignment builder, people picker, preview/resolution engine | IWorkflowDefinition, WorkflowDefinitionsPanel, WorkflowStepCard, ConditionBuilder, AzureADPeoplePicker, WorkflowPreview, useWorkflowDefinitions, workflowDefinitions.json, workflowStepOverrides.json | App.tsx (no route changes), AdminPanel.tsx (6 tabs), IDataService (152 methods), MockDataService, SharePointDataService, enums.ts (+3 enums, +6 values), permissions.ts (+workflow:manage), constants.ts (+4 HUB_LISTS), columnMappings.ts (+4 mappings), featureFlags.json (+WorkflowDefinitions) |
| 15 | Turnover to Ops Meeting Agenda — Two-tab TurnoverToOps rewrite (Meeting Agenda + Follow-Up Checklist), formal meeting procedure with prerequisites, estimate overview, 10 discussion items, subcontractor table, 10 exhibits, 4-party signature block with affidavit, workflow-driven signer resolution | ITurnoverAgenda.ts, turnoverAgendaTemplate.ts, turnoverAgendas.json, useTurnoverAgenda.ts | TurnoverToOps.tsx (rewrite), IDataService (169 methods), MockDataService, SharePointDataService, columnMappings.ts (+7 mappings), enums.ts (+TurnoverStatus, +10 AuditAction, +1 EntityType, +1 WorkflowKey), permissions.ts (+turnover:agenda:edit, +turnover:sign), constants.ts (+7 PROJECT_LISTS), workflowDefinitions.json (+TURNOVER_APPROVAL) |
| 16 | Hub Site Navigation Link Provisioning — Post-provisioning hub nav link creation under year-based labels, HubNavigationService (Mock + SP stub), IDataService hub URL config, AdminPanel hub URL editor + nav link status column + retry, ProvisioningService integration | HubNavigationService.ts | IProvisioningLog.ts (+HubNavLinkStatus), enums.ts (+5 AuditAction), IDataService.ts (+2 methods, 171 total), MockDataService.ts, SharePointDataService.ts, ProvisioningService.ts, constants.ts (+DEFAULT_HUB_SITE_URL), AdminPanel.tsx, GoNoGoScorecard.tsx, JobNumberRequestForm.tsx, AccountingQueuePage.tsx |

| 17 | Scorecard Unlock Fix, Director Role & Action Inbox — Bug fixes: getCurrentUser() returns real user from users.json per role (was hardcoded devuser email); canUnlock checks approval chain participants + Executive Leadership; canReview/canEnterCommitteeScores/canDecide grant Executive Leadership role-based access; respondToScorecardSubmission reassembles cycles defensively; submitScorecard looks up submitter displayName from users. New Action Inbox: aggregation widget on DashboardPage showing pending workflow items across 5 workflow types for current user. | IActionInbox.ts, useActionInbox.ts | MockDataService.ts (getCurrentUser role-to-user mapping, submitScorecard displayName lookup, respondToScorecardSubmission defensive reassembly, +getActionItems aggregation), useGoNoGo.ts (canUnlock/canReview/canEnterCommitteeScores/canDecide fixes), enums.ts (+2 enums), models/index.ts, IDataService.ts (+1 method, 172 total), SharePointDataService.ts (+1 stub), hooks/index.ts, DashboardPage.tsx (+Action Inbox section) |
| 18 | Department Director Role + Go/No-Go Workflow Bug Fixes — 13th RBAC role (DepartmentDirector) for non-C-suite directors (e.g., Director of Precon). Bug fixes: relockScorecard(startNewCycle:true) now creates approval cycle directly; getScorecardByLeadId/getScorecards return reassembled scorecards; updateScorecard preserves workflow state fields; defensive status guards on 4 mutation methods. | (none) | enums.ts (+DepartmentDirector), permissions.ts (+ROLE_PERMISSIONS entry, +NAV_GROUP_ROLES), useGoNoGo.ts (isExecLeadership→isDirectorOrExec, 5 locations), MockDataService.ts (relockScorecard cycle creation, getScorecardByLeadId/getScorecards reassembly, updateScorecard preservation, 4 status guards, getActionItems DepartmentDirector check), users.json (David Park→Department Director), RoleSwitcher.tsx (+1 option), DashboardPage.tsx (+3 RoleGate), GoNoGoMeetingScheduler.tsx (+DepartmentDirector attendees + RoleGate), ActiveProjectsDashboard.tsx (+RoleGate), MarketingDashboard.tsx (+RoleGate), EstimatingDashboard.tsx (+RoleGate), WinLossRecorder.tsx (+RoleGate), LossAutopsy.tsx (+RoleGate), NotificationService.ts (+Department Director to 18 recipient arrays) |
| 19 | UI Enhancements — 4-batch visual polish, information architecture, collaborative UI, and accessibility improvements across the entire app | Breadcrumb.tsx, SkeletonLoader.tsx, CollapsibleSection.tsx, SlideDrawer.tsx, ToastContainer.tsx, ActivityTimeline.tsx, usePersistedState.ts, useTabFromUrl.ts, useKeyboardShortcut.ts, breadcrumbs.ts | App.tsx (ToastProvider), AppShell.tsx (skip-link, print styles, ARIA landmarks, SkeletonLoader), tokens.ts (ELEVATION, TRANSITION), globalStyles.ts, KPICard.tsx, DataTable.tsx, 37 page files (SkeletonLoader replacing LoadingSpinner), 38 page files (Breadcrumb integration), AdminPanel.tsx (useTabFromUrl), TurnoverToOps.tsx (useTabFromUrl), LeadFormPage/LeadDetailPage/GoNoGoScorecard/BuyoutLogPage/ProjectStartupChecklist (useToast) |
| 19A | Permission Engine Core — Template-based authorization, project access scoping, feature-flagged resolution chain, tool permission map (23 tools x 4 levels), AppContext integration, ProjectPicker scoping | IPermissionTemplate.ts, IEnvironmentConfig.ts, toolPermissionMap.ts, permissionTemplates.json, securityGroupMappings.json, projectTeamAssignments.json, usePermissionEngine.ts | enums.ts (+PermissionLevel enum, +8 AuditAction, +2 EntityType), models/index.ts, constants.ts (+3 HUB_LISTS), permissions.ts (+3 keys), featureFlags.json (+PermissionEngine id:23), IDataService.ts (+15 methods, 187 total), MockDataService.ts (+15 implementations), SharePointDataService.ts (+15 stubs), columnMappings.ts (+3 mappings), AppContext.tsx (resolvedPermissions + re-resolution on project change), ProjectPicker.tsx (accessible project filtering), hooks/index.ts (+1 export) |
| 19B | Permission Engine Admin UI — PermissionTemplateEditor two-panel layout (template CRUD + tool permission matrix + security group mappings), ProjectTeamPanel for project-level team assignments, AdminPanel 7th tab | PermissionTemplateEditor.tsx, ToolPermissionMatrix.tsx, GranularFlagEditor.tsx, ProjectTeamPanel.tsx | AdminPanel.tsx (+7th Permissions tab), ProjectDashboard.tsx (+ProjectTeamPanel section), shared/index.ts (+2 exports), pages/hub/index.ts (+1 export), pages/project/index.ts (+1 export) |
| 19C | Environment Architecture — Tri-tier environment config (Dev/Vetting/Prod), template versioning, promotion workflow, environment badge in AppShell header | mock/environmentConfig.json | models/IEnvironmentConfig.ts (+IPromotionRecord), models/IPermissionTemplate.ts (+version, +promotedFromTier), services/IDataService.ts (+2 methods, 189 total), services/MockDataService.ts (+2 implementations), services/SharePointDataService.ts (+2 stubs), layouts/AppShell.tsx (environment badge), pages/hub/PermissionTemplateEditor.tsx (promote button + env banner) |
| 19D | Flexible Sectors + Identity — Dynamic sector definitions replacing hardcoded Sector enum, ISectorDefinition model, admin Sectors tab, identityType on ICurrentUser | models/ISectorDefinition.ts, mock/sectorDefinitions.json, hooks/useSectorDefinitions.ts | models/enums.ts (@deprecated Sector), models/IRole.ts (+identityType), services/IDataService.ts (+3 methods, 192 total), services/MockDataService.ts (+3 implementations), services/SharePointDataService.ts (+3 stubs), pages/hub/AdminPanel.tsx (8 tabs, +Sectors), pages/hub/LeadFormPage.tsx (dynamic sectors), pages/hub/PipelinePage.tsx (dynamic sectors), shared/ConditionBuilder.tsx (dynamic sectors), hooks/index.ts (+1 export), models/index.ts (+1 export), utils/constants.ts (+1 HUB_LIST) |
| 20 | SharePoint Admin Role + Dev Super-Admin — 14th RoleName (SharePointAdmin) with ALL permissions, Dev Super-Admin mode (union of ALL permissions, dev-only), full admin template (id:9, all 23 tools at ADMIN), resolveUserPermissions super-admin short-circuit + roleToGroupMap entry, NAV_GROUP_ROLES all 4 groups, RoleSwitcher with 15 options + super-admin toggle, mockContext.ts default fix | (none) | enums.ts (+SharePointAdmin), permissions.ts (+role entry with ...Object.values(PERMISSIONS), +NAV_GROUP_ROLES all 4 groups), users.json (+Alex Torres id:25), permissionTemplates.json (+id:9 full ADMIN), securityGroupMappings.json (+id:9), MockDataService.ts (+_isDevSuperAdmin, +setDevSuperAdminMode, getCurrentUser super-admin branch, resolveUserPermissions super-admin short-circuit + SharePoint Admin in roleToGroupMap), RoleSwitcher.tsx (RoleValue union type, 15 options, red pill for super-admin), dev/index.tsx (RoleValue type, super-admin detection), dev/mockContext.ts (default→ExecutiveLeadership) |

| 21 | Preconstruction Navigation Cleanup — Reduced Preconstruction nav from 10→7 items, moved Accounting Queue to new Accounting nav group, moved Go/No-Go Tracker from EstimatingDashboard tab to PipelinePage tab. PipelinePage now 2-tab (Pipeline + Go/No-Go Tracker). EstimatingDashboard now 3-tab (removed Go/No-Go). | (none) | NavigationSidebar.tsx (removed 3 items, added Accounting group, updated Go/No-Go path), permissions.ts (+Accounting NAV_GROUP_ROLES), EstimatingDashboard.tsx (removed tab 3, gonogoRegionFilter, gonogoLeads, gonogoColumns, GoNoGoDecision import), PipelinePage.tsx (2-tab rewrite: Pipeline + Go/No-Go Tracker with region filter, sort, export), App.tsx (+/preconstruction/pipeline/gonogo route, /preconstruction/gonogo→PipelinePage), constants.ts (+PRECON_PIPELINE_GONOGO) |
| 22 | Lead-to-Site Workflow Enhancement — ScorecardStatus 8→10 values (BDDraft, AwaitingDirectorReview, DirectorReturnedForRevision, AwaitingCommitteeScoring, CommitteeReturnedForRevision, Rejected, NoGo, Go, Locked, Unlocked), IAssignmentMapping model for admin-configurable Director/Estimator assignments per Region/Sector, BD Leads folder creation on lead create, GoNoGoScorecard Save/Submit + Director review/reject + Committee Go/NoGo/Return + archive flow, PipelinePage Go/No-Go Tracker Pending/Archive sub-tabs with advanced filtering, JobNumberRequestForm optional lead association, AdminPanel Assignment Mappings CRUD, 7 new NotificationService event handlers | IAssignmentMapping.ts, assignmentMappings.json, useAssignmentMappings.ts | enums.ts (ScorecardStatus 10 values, +3 AuditAction, +7 NotificationEvent, +1 EntityType), IGoNoGoScorecard.ts (+unlockedSections, +isArchived, +archivedDate, +archivedBy), models/index.ts, IDataService.ts (+8 methods, 200 total), MockDataService.ts (+8 implementations, updated scorecard workflow methods for new statuses), SharePointDataService.ts (+8 stubs), columnMappings.ts (+Assignment_Mappings), NotificationService.ts (+7 event handlers), constants.ts (+ASSIGNMENT_MAPPINGS, +BD_LEADS constants), permissions.ts (+gonogo:review, +admin:assignments:manage), hooks/index.ts (+1 export), useGoNoGo.ts (new statuses, +canReviewDirector, +canReviewCommittee, +canArchive, +rejectScorecard, +archiveScorecard), GoNoGoScorecard.tsx (Save/Submit, Director/Committee action bars, reject/archive dialogs), PipelinePage.tsx (Pending/Archive sub-tabs, advanced filters, scorecard-lead join), LeadFormPage.tsx (+BD Leads folder creation), JobNumberRequestForm.tsx (+optional lead association, manual fields), EstimatingDashboard.tsx (+Request New Project Number button), AdminPanel.tsx (+Assignment Mappings section), scorecards.json (updated to new ScorecardStatus values) |

| 23 | BD Representative UX Enhancements — Structured address fields on lead form/detail (AddressStreet, AddressCity, AddressState, AddressZip), Pipeline "Created Date" (DateSubmitted) sortable column with newest-first default sort, LeadDetailPage full edit mode (all fields become editable inputs), GoNoGoScorecard immediate actions (canSubmit allows null scorecard for new creation), BD Rep permission expansion (marketing:dashboard:view, marketing:edit, projectrecord:edit, precon:hub:view, autopsy:edit, autopsy:schedule), BD Rep added to Marketing nav group | (none) | ILead.ts (+AddressStreet, +AddressCity, +AddressState, +AddressZip, +DateSubmitted, -ProjectAddress), validators.ts (+AddressCity/AddressState required), LeadFormPage.tsx (address field grid, US_STATES dropdown, CityLocation auto-populate, DateSubmitted auto-set), LeadDetailPage.tsx (full edit mode with Input/Select/Textarea for all fields, address section, Notes field), PipelinePage.tsx (+DateSubmitted column, default sort DateSubmitted desc), useGoNoGo.ts (canSubmit allows null scorecard), permissions.ts (+6 BD Rep permissions, +BD Rep to Marketing nav group), leads.json (+4 address fields on all 29 records), columnMappings.ts (+AddressStreet/City/State/Zip/DateSubmitted, -ProjectAddress), AccountingQueuePage.tsx (-ProjectAddress ref), MockDataService.ts (-ProjectAddress ref) |

| 24 | Estimating Coordinator UX Enhancements — EC landing page redirect, remove Kick-Off Checklists nav item, inline-editable dashboard tables (3 tabs, ~30 columns with InlineInput/InlineNumber/InlineDate/InlineSelect helpers), Current Pursuits column auto-sizing + header cleanup + row-click navigation + Kick-Off button removal, EstimatingKickoffPage overhaul (route param fix `:id` not `:projectCode`, lead selector, Key Personnel with AzureADPeoplePicker, checklist with multi-select assignees, role-filtered Pursuit Tools), AzureADPeoplePicker multi-select support (discriminated union props), PursuitDetail tool filtering + Estimating Kickoff button removal, EC GONOGO_SCORE_ORIGINATOR permission removed | (none) | DashboardPage.tsx, NavigationSidebar.tsx, EstimatingDashboard.tsx, EstimatingKickoffPage.tsx, PursuitDetail.tsx, AzureADPeoplePicker.tsx, IEstimatingKickoff.ts, useEstimatingKickoff.ts, IDataService.ts, MockDataService.ts, SharePointDataService.ts, permissions.ts, estimatingKickoffs.json, columnMappings.ts |

| 25 | Job Number Request Form Alignment — Fixed Skip mode transition bug (`isLeadSelection` now checks `&& !lead`), expanded noLeadMode entry screen from 3→6 fields (added Division select, Sector select, ProjectValue input), 2-column grid layout, main form header shows Division/Sector/Region/ProjectValue context. No model/service/hook/mock data changes. | (none) | JobNumberRequestForm.tsx |

| 26 | Project Selection Behavior — Site detection wired into app (`siteDetector.ts` → AppContext `isProjectSite`), auto-select project on project-specific SP sites, ProjectPicker `locked` mode for project sites, `hubOnly` nav item flag hides multi-project views when project selected, dynamic Lead Detail/Go/No-Go nav items under Preconstruction when project selected, `setProjectSiteUrl()` dual-web plumbing on IDataService/MockDataService/SharePointDataService, dashless project code regex fix in siteDetector (supports `2504201` → `25-042-01` conversion), `ISelectedProject` gains `siteUrl?` field, `IAppContextValue` gains `isProjectSite` boolean | (none) | HbcProjectControlsWebPart.ts, App.tsx, AppContext.tsx, siteDetector.ts, ProjectPicker.tsx, NavigationSidebar.tsx, IDataService.ts, MockDataService.ts, SharePointDataService.ts |
| 27 | Admin Project Assignments — Hub-level project-user assignment panel in AdminPanel (9th tab "Assignments"). `getAllProjectTeamAssignments()` returns all active assignments across projects. `inviteToProjectSiteGroup()` fire-and-forget SP group invitation (console.log in mock). `addGroupMember()` on GraphService for MS Graph group membership. `usePermissionEngine` hook extended with `getAllAssignments` and `inviteToSiteGroup`. `ProjectAssignmentsPanel.tsx`: Project-grouped layout — main DataTable of projects (code, name, team count badge) with expand/collapse chevrons; expanded section shows per-project assignment sub-DataTable + inline batch-add form (multi-select AzureADPeoplePicker, role select, template override, sequential await per user); useActiveProjects for project name enrichment; search bar filters by name/code. Permission-gated by `permission:project_team:manage`. | ProjectAssignmentsPanel.tsx | IDataService.ts (+2 methods, 204 total), MockDataService.ts, SharePointDataService.ts, GraphService.ts (+addGroupMember), usePermissionEngine.ts, AdminPanel.tsx (9 tabs), pages/hub/index.ts |
| 28 | Post-Bid Autopsy Create Button — "Create New Autopsy Report" button in PostBidAutopsyList PageHeader with inline lead selector (dropdown of eligible ArchivedLoss leads without existing autopsy). New `autopsy:create` permission (BD Rep, Est Coord, Exec, Dept Dir, SP Admin). Bug fix: PostBidAutopsyForm `useParams` param mismatch (`:id` not `:leadId`). | (none) | PostBidAutopsyList.tsx (+create button, +lead selector, +permission gate), PostBidAutopsyForm.tsx (param fix: `leadId` → `id`), permissions.ts (+AUTOPSY_CREATE, +4 ROLE_PERMISSIONS entries) |
| 28A | Feature Flags Admin Enhancement — `FeatureFlagCategory` type + `Category?` on IFeatureFlag, grouped CollapsibleSection panels in AdminPanel Feature Flags tab, `featureFlag?` field on NavigationSidebar INavItem for flag-gating nav items (11 items mapped), fixed ActiveProjectsDashboard FeatureGate bug (`"ActiveProjectsDashboard"` → `"ExecutiveDashboard"`). | (none) | IFeatureFlag.ts (+FeatureFlagCategory, +Category), featureFlags.json (+Category on all 23 entries), columnMappings.ts (+Category), AdminPanel.tsx (grouped flags), NavigationSidebar.tsx (+featureFlag on INavItem, +isFeatureEnabled check), ActiveProjectsDashboard.tsx (FeatureGate fix) |
| 28B | Feature Flag Route-Level Enforcement & Display Names — `DisplayName` field on IFeatureFlag for human-readable labels in AdminPanel. Route-level `<FeatureGate>` wrappers on 20 routes in App.tsx (LeadIntake, GoNoGoScorecard, PipelineDashboard, LossAutopsy, EstimatingTracker, TurnoverWorkflow, ProjectStartup, ProjectManagementPlan, MonthlyProjectReview). 3 additional nav-level featureFlag entries (Estimating Dashboard, Precon Tracker, Estimate Log → EstimatingTracker). AdminPanel displays DisplayName in flag table, confirm dialog, and audit log. | (none) | IFeatureFlag.ts (+DisplayName), featureFlags.json (+DisplayName on all 23 entries), columnMappings.ts (+DisplayName), AdminPanel.tsx (DisplayName in 3 places), App.tsx (+FeatureGate on 20 routes, +FeatureGate import), NavigationSidebar.tsx (+featureFlag on 3 items) |
| 29 | Site Provisioning Workflow Enhancements — 4 enhancements: (A) Project Setup Tracker widget on DashboardPage with real-time provisioning visibility (auto-refresh 10s, 7-dot step progress, summary KPIs), (B) Centralized pre-provisioning validation hook composing validators.ts + async duplicate check, (C) ProvisioningService `provisionSiteWithFallback()` three-tier fallback (PowerAutomate → local 7-step → offline queue), (D) Feature flag gating on IWorkflowStep (`featureFlagName?`, `isSkippable?`) with MockDataService `resolveWorkflowChain()` skip/omit logic. | useProvisioningTracker.ts, useProvisioningValidation.ts | IWorkflowDefinition.ts (+featureFlagName?, +isSkippable? on IWorkflowStep; +skipped?, +skipReason? on IResolvedWorkflowStep), ProvisioningService.ts (+provisionSiteWithFallback(), extended constructor), MockDataService.ts (resolveWorkflowChain feature flag check), columnMappings.ts (+featureFlagName, +isSkippable on WORKFLOW_STEPS_COLUMNS), workflowDefinitions.json (+featureFlagName/isSkippable on GO_NO_GO step 2), DashboardPage.tsx (+Project Setup Tracker widget), JobNumberRequestForm.tsx (+useProvisioningValidation, +provisionSiteWithFallback), WorkflowStepCard.tsx (+feature flag badge), WorkflowPreview.tsx (+skipped step display), hooks/index.ts (+2 exports) |
| 30 | SPFx Deployment Readiness Assessment — Comprehensive audit of build process, version alignment, stub coverage, Graph API scopes, provisioning gaps, and prioritized remediation roadmap. Added `Group.ReadWrite.All` Graph scope for `addGroupMember()`. Created `docs/DEPLOYMENT_READINESS.md` with MVD scope, 5-tier remediation plan, SP list inventory (32 hub + 37 per-project), and configuration checklist. Confirmed SPFx 1.21.1 alignment across all 10 packages. Identified `getCurrentUser()` as P1 deployment blocker. | docs/DEPLOYMENT_READINESS.md | config/package-solution.json (+Group.ReadWrite.All scope, 10 total), CLAUDE.md (§15 +Phase 30, §16 +pitfalls #41-#42) |
| 31 | Tier 0 Deployment Gate Remediation — Implemented all 4 Tier 0 items from the Stub Risk Analysis plan: (0.1) `getCurrentUser()` implemented in SharePointDataService using SPFx page context + App_Roles SP list lookup + ROLE_PERMISSIONS mapping, (0.2) GraphService initialized in WebPart.onInit() via `msGraphClientFactory.getClient('3')`, (0.3) Added try/catch error handling to all 12 unprotected useGoNoGo callbacks and all 12 unprotected usePermissionEngine callbacks, (0.4) Added `[STUB]` console.warn logging to all ~35 Pattern A stubs and descriptive error messages to all ~93 Pattern B stubs. WebPart entry point now supports `dataServiceMode` property ('mock' \| 'sharepoint') for service switching. | (none) | HbcProjectControlsWebPart.ts (dataServiceMode property, PnP SP init, initializeContext(), GraphService init), SharePointDataService.ts (getCurrentUser impl, initializeContext method, [STUB] logging on all Pattern A stubs, descriptive errors on Pattern B stubs), useGoNoGo.ts (+try/catch on 12 callbacks), usePermissionEngine.ts (+try/catch on 12 callbacks) |
| 32 | Permissions & Security Remediation — Removed 2 unused Graph API scopes (`User.Read.All`, `Sites.ReadWrite.All`) from package-solution.json (10→8 scopes). Fixed provisioning URL domain mismatch (`hedrickbrothers` → `hedrickbrotherscom` in ProvisioningService.ts lines 158 and 259). Added audit logging to all 8 GraphService methods via `GraphAuditLogger` callback pattern (mutations log success+failure, reads log failure only). `setAuditLogger()` wired in WebPart.onInit() after dataService creation. Fire-and-forget `inviteToSiteGroup` in usePermissionEngine.ts now logs 403/failure to audit trail. 4 new AuditAction values, 1 new EntityType value. Updated docs/DEPLOYMENT_READINESS.md with phased admin consent strategy, corrected scope counts, marked Phase 31 fixes as resolved. | (none) | config/package-solution.json (-User.Read.All, -Sites.ReadWrite.All, 8 scopes), services/GraphService.ts (+GraphAuditLogger type, +setAuditLogger(), +logGraphCall(), try/catch + audit on all 8 methods), services/index.ts (+GraphAuditLogger export), HbcProjectControlsWebPart.ts (+graphService.setAuditLogger wiring), services/ProvisioningService.ts (URL fix lines 158, 259), models/enums.ts (+4 AuditAction, +1 EntityType), components/hooks/usePermissionEngine.ts (+audit log on inviteToSiteGroup failure), docs/DEPLOYMENT_READINESS.md (scope analysis rewrite, phased consent, getCurrentUser resolved, domain fix noted) |
| SP-1 | SharePointDataService Chunk 1: Permissions & Security — Replaced 20 stubs with live PnP/SP implementations (51→71 implemented, 153→133 stubs). Permission Templates CRUD (5 methods), Security Group Mappings CRUD (3), Project Team Assignments CRUD + soft delete (7), inviteToProjectSiteGroup (fire-and-forget SP group add by role convention), resolveUserPermissions (full 5-step resolution chain: roles → security group mapping → template → project override → granular flags → resolveToolPermissions), getAccessibleProjects (globalAccess check + filtered assignments), getEnvironmentConfig (App_Context_Config with prod fallback), promoteTemplates (batch version increment + promotion history), setHubSiteUrl (upsert on App_Context_Config). 3 private mapper helpers added (mapToPermissionTemplate, mapToSecurityGroupMapping, mapToProjectTeamAssignment) using column mappings with JSON parse/stringify for toolAccess and granularFlagOverrides. | (none) | SharePointDataService.ts (20 stubs→implementations, +3 mapper helpers, +7 imports), CLAUDE.md (§15, §16) |
| SP-2 | SharePointDataService Chunk 2: Provisioning & Infrastructure — Replaced 10 stubs with live PnP/SP implementations (71→81 implemented, 133→123 stubs). Provisioning Core (3 methods): triggerProvisioning (creates Provisioning_Log item via PROVISIONING_LOG_COLUMNS), updateProvisioningLog (find-by-projectCode + partial update + re-read), retryProvisioning (reset failure state + increment retryCount). BD Leads Folder Operations (4 methods): createBdLeadFolder (cross-site Web() factory to PX Portfolio Dashboard, year/lead/9 subfolder hierarchy), checkFolderExists (BD Leads library or hub site), createFolder (recursive segment creation), renameFolder (moveByPath). Data Integrity (3 methods): syncDenormalizedFields (5 hub lists via PnP batch — Estimating_Tracker, PMP, Marketing_Project_Records, Provisioning_Log, Job_Number_Requests), promoteToHub (cross-site Lessons_Learned copy + PMP close), rekeyProjectCode (6 hub lists via batch helper). Added hubNavLinkStatus to PROVISIONING_LOG_COLUMNS. | (none) | SharePointDataService.ts (10 stubs→implementations, +2 imports), columnMappings.ts (+hubNavLinkStatus), CLAUDE.md (§7, §15, §16) |
| SP-3 | SharePointDataService Chunk 3: Workflow Definitions — Replaced 10 stubs with live PnP/SP implementations (81→91 implemented, 123→113 stubs). Workflow Definition reads (2 methods): getWorkflowDefinitions (3-list parallel read + assembly), getWorkflowDefinition (filtered single-workflow read with step+conditional assembly). Step & Conditional Assignment mutations (4 methods): updateWorkflowStep (column-mapped update + parent lastModifiedDate), addConditionalAssignment (JSON.stringify conditions/assignee + parent timestamp), updateConditionalAssignment, removeConditionalAssignment (recycle + parent timestamp). Override CRUD (3 methods): getWorkflowOverrides (filter by projectCode), setWorkflowStepOverride (upsert: delete existing for same projectCode+stepId, then add), removeWorkflowStepOverride (recycle). resolveWorkflowChain (4-tier resolution: Override → ProjectRole → Condition → Default, with feature flag gating for skip/omit — reads from 7 data sources). 5 private helpers added (mapToWorkflowDefinition, mapToWorkflowStep, mapToConditionalAssignment, mapToWorkflowStepOverride, getLeadFieldValue) + 1 internal assembly method (assembleAllWorkflowDefinitions). | (none) | SharePointDataService.ts (10 stubs→implementations, +4 column mapping imports, +2 enum imports, +6 private helpers), CLAUDE.md (§7, §15, §16) |

| SP-4 | SharePointDataService Chunk 4: Checklists, Matrices & Marketing Records — Replaced 22 stubs with live PnP/SP implementations (107→129 implemented, 105→83 stubs remaining of 212 total). Startup Checklist (4 methods): getStartupChecklist (2-list parallel read Startup_Checklist + Checklist_Activity_Log, grouped activity map), updateChecklistItem (partial update + activity log write + re-read), addChecklistItem, removeChecklistItem (recycle). Internal Matrix (4 methods): getInternalMatrix, updateInternalMatrixTask, addInternalMatrixTask, removeInternalMatrixTask. Team Role Assignments (2 methods): getTeamRoleAssignments, updateTeamRoleAssignment (upsert: filter by projectCode+role, update or create). Owner Contract Matrix (4 methods): getOwnerContractMatrix, updateOwnerContractArticle, addOwnerContractArticle, removeOwnerContractArticle. Sub-Contract Matrix (4 methods): getSubContractMatrix, updateSubContractClause, addSubContractClause, removeSubContractClause. Marketing Project Records (4 methods): getMarketingProjectRecord (find by projectCode), createMarketingProjectRecord (buildMarketingUpdateData reverse mapper), updateMarketingProjectRecord (find-by-code + partial update), getAllMarketingProjectRecords. Added `_getProjectWeb()` private helper (Web() factory for cross-site project access, fallback to sp.web). 7 private mapper helpers added (mapToStartupChecklistItem, mapToChecklistActivityEntry, mapToInternalMatrixTask, mapToOwnerContractArticle, mapToSubContractClause, mapToMarketingProjectRecord, buildMarketingUpdateData). New column mapping: TEAM_ROLE_ASSIGNMENTS_COLUMNS. New PROJECT_LIST: Team_Role_Assignments. | (none) | SharePointDataService.ts (22 stubs→implementations, +7 column mapping imports, +1 model import, +8 private helpers incl. _getProjectWeb), columnMappings.ts (+TEAM_ROLE_ASSIGNMENTS_COLUMNS), constants.ts (+TEAM_ROLE_ASSIGNMENTS to PROJECT_LISTS), CLAUDE.md (§7, §13, §15, §16) |

| Theme-1 | Fluent UI v9 Full Theming + makeStyles Migration — Enhanced hbcTheme.ts from 4→30+ token overrides (brand foreground/background, neutral foreground/background, stroke, subtle, status, shadows). Expanded globalStyles.ts from 13→40+ reusable Griffel classes (layout, card variants, form patterns, table patterns, action bar, KPI grid, status badges, dropdown overlay, pagination, spinner). Converted 10 shared components from inline `style={{}}` to `makeStyles`: AppShell, NavigationSidebar, DataTable, KPICard, PageHeader, SearchBar, StageBadge, StatusBadge, ExportButtons, LoadingSpinner. Added TRANSITION constant to tokens.ts (fast/normal/slow). Updated tsconfig.json `jsx: "react"` → `"react-jsx"` (automatic JSX transform, React 17.0.1 compatible). No data service, model, or workflow files touched. | TRANSITION added to tokens.ts | hbcTheme.ts (30+ token overrides), globalStyles.ts (40+ classes), tokens.ts (+TRANSITION), tsconfig.json (jsx: react-jsx), AppShell.tsx, NavigationSidebar.tsx, DataTable.tsx, KPICard.tsx, PageHeader.tsx, SearchBar.tsx, StageBadge.tsx, StatusBadge.tsx, ExportButtons.tsx, LoadingSpinner.tsx |

| React18 | React 18.2.0 Migration — Bumped react/react-dom from 17.0.1→18.2.0, @types/react/@types/react-dom from 17.x→18.2.0, @testing-library/react from ^12.1.5→^14.0.0. Added npm `overrides` for 3 SPFx packages (`@microsoft/sp-core-library`, `sp-webpart-base`, `sp-property-pane`) to bypass `<18.0.0` peer dep constraints. WebPart `render()`→`createRoot()` + `Root` lifecycle (`_root` field, lazy init, `unmount()` in `onDispose`). Dev server `ReactDOM.render()`→`createRoot().render()`. Zero component/style/service/workflow files touched. `tsc --noEmit` passes with zero errors. | (none) | package.json (react 18.2.0, types 18.2.0, +overrides, @testing-library/react ^14), HbcProjectControlsWebPart.ts (createRoot + Root), dev/index.tsx (createRoot) |

| Perf-1 | Route-based Code Splitting — Replaced 40 static page imports in App.tsx with `React.lazy()` + `lazyNamed()` helper for named-export modules. Single `React.Suspense` boundary wraps `<Routes>` with `<PageLoader />` fallback (centered Fluent Spinner, makeStyles). Shell stays in main bundle: FluentProvider, AppProvider, HashRouter, AppShell, NavigationSidebar, ErrorBoundary, ToastProvider, guards (ProtectedRoute, ProjectRequiredRoute, FeatureGate), NotFoundPage, AccessDeniedPage. 2 dead imports removed (GoNoGoTracker, PreconKickoff — were imported but never routed). Zero route guard, service, model, or styling changes. `tsc --noEmit` clean. | PageLoader.tsx | App.tsx (40 static→lazy imports, +Suspense boundary, +lazyNamed helper, -2 dead imports), shared/PageLoader.tsx (new), shared/index.ts (+PageLoader export) |

<<<<<<< extract-common-services
| Lib-1 | Extract `@hbc/sp-services` Shared Library — Moved 114 files (45 models + 14 services + 13 utils + 42 mock JSON) from `src/webparts/hbcProjectControls/` into `packages/hbc-sp-services/src/` as a standalone npm workspace package. Monorepo structure via npm workspaces (`"workspaces": ["packages/*"]`). Package barrel `index.ts` re-exports all models, services, utils, and `MOCK_USERS` from mock/users.json. All ~106 app files rewritten from relative imports (`../../models`, `../../services/*`, `../../utils/*`) to `from '@hbc/sp-services'`. Duplicate imports consolidated. Root tsconfig `rootDir` changed from `"src"` to `"."` to accommodate path alias resolution into packages/. Old path aliases (`@services/*`, `@models/*`, `@utils/*`) removed; new `@hbc/sp-services` alias added. Webpack dev config updated. `tsc --noEmit` passes on all 3 tsconfigs (root, dev, package). Webpack dev build compiles successfully. Zero model, service, utility, or component logic changes — purely structural refactor. | packages/hbc-sp-services/ (package.json, tsconfig.json, src/index.ts) | ~106 app files (import rewrites), package.json (workspaces, dependency, build scripts), tsconfig.json (rootDir, paths), dev/webpack.config.js (aliases), services/index.ts (added missing singleton/type exports), AzureADPeoplePicker.tsx (MOCK_USERS import), PursuitDetail.tsx (inline import type fix) |
=======
| CI-1 | GitHub Actions CI/CD Pipeline — ci.yml (full build on push/PR with .sppkg artifact upload), release.yml (tag-triggered GitHub Release with .sppkg asset), pr-validation.yml (fast type-check + lint for PRs), dependabot.yml (weekly npm + GitHub Actions updates, SPFx packages pinned to patch-only). Node 18.18.2 in CI (within engines range). Zero source code files touched. | .github/workflows/ci.yml, .github/workflows/release.yml, .github/workflows/pr-validation.yml, .github/dependabot.yml | CLAUDE.md (§1 +CI/CD table, §2 +.github dir, §15 +Phase CI-1) |
>>>>>>> main

### Known Stubs / Placeholders

- **SharePointDataService**: 83 of 212 methods are stubs. Breakdown: 21 Pattern A stubs (`[STUB]` console.warn + empty return), 56 Pattern B stubs (`implementation pending` throw), 6 delegation stubs (intentionally delegate to GraphService/PowerAutomate — will never be SP list operations). Remaining stubs: all risk/cost/quality/safety/schedule, all superintendent plan, all lessons learned, all PMP (7), all monthly review (4), all estimating kickoff (8 incl. updateKickoffKeyPersonnel), all job number requests (4), all turnover agenda (16), all sector definitions (2 mutations), all assignment mappings (3 mutations), reference data (2), scorecard workflow (7), scorecard archive (2), action inbox (SP). `setProjectSiteUrl()` is implemented (creates cross-site Web via `_getProjectWeb()`). All Pattern A stubs log `console.warn('[STUB] methodName not implemented')`. All Pattern B stubs throw `Error('SharePoint implementation pending: methodName')`. Delegation stubs: getCalendarAvailability, createMeeting, getMeetings (→GraphService), sendNotification, getNotifications (→PowerAutomate), purgeOldAuditEntries (→Power Automate scheduled flow).
- **HubNavigationService**: SharePointHubNavigationService is a stub (all 3 methods throw).
- **Column Mappings**: `columnMappings.ts` has mappings for all lists. Permission Templates, Security Group Mappings, Project Team Assignments, Provisioning Log, Workflow Definitions (4 lists), Startup Checklist, Checklist Activity Log, Internal Matrix, Team Role Assignments, Owner Contract Matrix, Sub Contract Matrix, and Marketing Project Records now use column mappings in SharePointDataService.
- **Offline Support**: `OfflineQueueService.ts` exists but feature flag `OfflineSupport` is disabled.
- **Dual Notifications**: `DualNotifications` feature flag exists but is disabled.
- **Audit Trail UI**: `AuditTrail` feature flag exists but detailed UI not built.
- **ERP Integrations**: `UnanetIntegration`, `SageIntegration`, `DocumentCrunchIntegration`, `EstimatingModule`, `BudgetSync` — all flagged off, no implementation.
- **Navigation Sidebar Phase 12 Design Gap**: The Phase 12 design calls for Closeout Checklist under "Project Manual" (currently under "Commitments") and a new "Project Record" sub-group containing Project Record, Lessons Learned, and Go/No-Go (read-only). The actual `NavigationSidebar.tsx` has not been updated to reflect this design yet.

### SharePointDataService Status

- **Implemented (129 of 212)**: Leads CRUD, Go/No-Go CRUD (base 5), Estimating CRUD, Roles/Flags CRUD, Audit log/read, **Provisioning CRUD** (trigger/update/retry/read/list), Phase 6 workflow (team, deliverables, interview, contract, turnover items, closeout, loss autopsy — 17 methods), Buyout/Commitment/Compliance, Active Projects Portfolio, AppContextConfig, hub site URL read/write, **getCurrentUser** (Phase 31), **Permission Templates CRUD** (5), **Security Group Mappings CRUD** (3), **Project Team Assignments CRUD + soft delete** (7), **inviteToProjectSiteGroup** (fire-and-forget SP group add), **resolveUserPermissions** (full resolution chain), **getAccessibleProjects** (computed), **getEnvironmentConfig** (with fallback), **promoteTemplates** (batch update + config write), **BD Leads folder ops** (create/check/mkdir/rename via cross-site Web()), **syncDenormalizedFields** (5-list batch), **promoteToHub** (cross-site lessons + PMP close), **rekeyProjectCode** (6-list batch), **Workflow Definitions CRUD** (10 — definitions read/assembly, step/conditional mutations, override upsert, resolveWorkflowChain 4-tier resolution), **Startup Checklist CRUD** (4 — 2-list join for reads with activity log grouping), **Internal Matrix CRUD** (4), **Team Role Assignments** (2 — upsert by role), **Owner Contract Matrix CRUD** (4), **Sub-Contract Matrix CRUD** (4), **Marketing Project Records CRUD** (4 — 88-column mapping with JSON array parse/stringify)
- **Delegation stubs (6)**: getCalendarAvailability, createMeeting, getMeetings (→GraphService), sendNotification, getNotifications (→PowerAutomate), purgeOldAuditEntries (→Power Automate flow) — intentionally NOT SP list operations
- **Stubbed (77)**: All risk/cost/quality/safety/schedule (10), all superintendent plan (3), all lessons learned (3), all PMP incl. signPMP/getDivisionApprovers/getPMPBoilerplate (7), all monthly review (4), all estimating kickoff incl. updateKickoffKeyPersonnel (8), all job number requests (4), all turnover agenda (16), sector definitions mutations (2), assignment mapping mutations (3), reference data (2), scorecard workflow (7 — submit/respond/enterCommittee/recordFinal/unlock/relock/getVersions), scorecard archive (2 — reject/archive), action inbox (1), getSectorDefinitions (1), getAssignmentMappings (1)

---

## §16 Common Pitfalls

1. **`currentUser.Email` vs `currentUser?.email`** — The `ICurrentUser` interface uses lowercase `email`. Always use `currentUser?.email` with null safety. Never use `.Email` (PascalCase).

2. **NotificationService switch statement** — When adding new `NotificationEvent` enum values, the switch statement in `NotificationService.ts` must include a case for the new event. Missing cases will silently fail. Always add a handler or explicit default.

3. **Barrel exports must be updated** — Every directory has an `index.ts` barrel file. When adding new files to `models/`, `hooks/`, `shared/`, or `pages/*/`, you MUST add the export to the corresponding `index.ts`. Build will succeed but runtime imports will fail.

4. **`volta run --node 22.14.0` prefix for gulp** — The `engines` field in package.json says `>=18.17.1 <19.0.0` but Volta is pinned to `22.14.0`. SPFx gulp commands may need the volta prefix to run correctly: `volta run --node 22.14.0 gulp serve --nobrowser`.

5. **Mock data deep clone** — `MockDataService` must deep-clone JSON data on read. Returning direct references to the mock arrays causes mutations to persist across tests/renders. Use `JSON.parse(JSON.stringify(data))` pattern.

6. **`@denormalized` fields must stay in sync** — When updating a lead's `Title` or `ProjectValue`, all denormalized copies (in IEstimatingTracker.Title, IJobNumberRequest.ProjectExecutive, etc.) must be updated. Use `syncDenormalizedFields(leadId)`.

7. **Project code format** — Must match `yy-nnn-0m` (e.g., `25-042-01`). Validated in `validators.ts`. Generated codes in mock data must follow this pattern.

8. **HashRouter, not BrowserRouter** — SPFx uses `HashRouter`. All navigation uses hash-based URLs (`#/operations/buyout-log`). Do not switch to `BrowserRouter`.

9. **makeStyles + minimal inline styles** — No CSS modules or SCSS. Shared components use `makeStyles()` with Fluent `tokens.*` and `HBC_COLORS`. Pages may still use inline `style={{}}`. Do not introduce CSS files. See §4 Hybrid CSS Pattern for the decision rule.

10. **Fire-and-forget audit calls** — `logAudit()` calls should not be awaited in the UI flow. They are non-blocking. Wrapping them in `try/catch` with no re-throw is the pattern.

11. **PMP approval cycle numbering** — `currentCycleNumber` on `IProjectManagementPlan` must be incremented when creating new approval cycles. The `submitPMPForApproval` method handles this automatically.

12. **Flattened child collections in MockDataService** — Mock JSON files store parent and child entities in flat arrays. The `MockDataService` assembles them (e.g., kickoff + kickoffItems, riskCost + riskCostItems). New entities with children must follow this pattern.

13. **MockDataService.getCurrentUser() returns real users per role** — `getCurrentUser()` looks up the first user from `users.json` matching the selected role. This ensures the mock user's email aligns with workflow step assignee emails. When adding new workflow steps with email-based assignees, verify the assignee email exists in `users.json` and matches the expected role. BD Rep = Sarah Mitchell (`smitchell`), Executive Leadership = Mike Hedrick (`mhedrick`).

14. **Scorecard workflow permissions need Executive Leadership OR DepartmentDirector role check** — `canReview`, `canEnterCommitteeScores`, `canDecide`, and `canUnlock` in `useGoNoGo.ts` use `isDirectorOrExec` which checks both `RoleName.ExecutiveLeadership` and `RoleName.DepartmentDirector`. When adding new leadership-level role checks, always include both roles.

15. **DepartmentDirector is NOT Executive Leadership** — Department Directors have operational permissions (Go/No-Go decide, PMP approve, meeting schedule, etc.) but NO admin access (`admin:*`, `workflow:manage`). When adding RoleGate checks for leadership access, include `RoleName.DepartmentDirector` alongside `RoleName.ExecutiveLeadership` in page-level guards. Do NOT add DepartmentDirector to Admin-gated components.

16. **relockScorecard(startNewCycle: true) creates its own approval cycle** — The `relockScorecard()` method in MockDataService creates a 2-step approval cycle directly when `startNewCycle=true`. The caller (GoNoGoScorecard.tsx `handleRelock()`) does NOT need to also call `submitScorecard()`. This is different from the initial submission flow.

17. **updateScorecard() preserves workflow state** — `updateScorecard()` explicitly preserves `approvalCycles`, `versions`, `scorecardStatus`, `isLocked`, `currentVersion`, and `currentApprovalStep`. To modify these fields, use the dedicated methods (`submitScorecard`, `respondToScorecardSubmission`, `enterCommitteeScores`, `recordFinalDecision`, `unlockScorecard`, `relockScorecard`).

18. **SkeletonLoader replaces LoadingSpinner for full-page loading** — All page-level loading states now use `<SkeletonLoader variant="...">` instead of `<LoadingSpinner>`. Only use `LoadingSpinner` for inline/small loading indicators (e.g., `size="small"` within a section). The variant should match the page content: `table` for DataTable pages, `form` for form pages, `card` for detail views, `kpi-grid` for dashboard KPI sections.

19. **ToastProvider must wrap HashRouter** — The `ToastProvider` in App.tsx must be inside `AppProvider` (needs context) but outside `HashRouter`. Toast messages use `useToast()` hook — never create custom inline toast divs. Toast types: `success`, `error`, `warning`, `info`.

20. **useTabFromUrl for deep-linkable tabs** — Tabbed pages (AdminPanel, TurnoverToOps) use `useTabFromUrl` hook to sync tab state with URL `?tab=` parameter. Pages that already use route-based tabs (EstimatingDashboard, ResponsibilityMatrices) should NOT use this hook — they are already URL-driven via `navigate()`.

21. **PermissionEngine feature flag controls permission resolution** — When `PermissionEngine` flag is enabled (id: 23), AppContext resolves permissions via `resolveUserPermissions()` instead of `ROLE_PERMISSIONS`. When disabled, the app falls back to `ROLE_PERMISSIONS[role]` (zero regression). The resolution chain: Role → Security Group Mapping → Template → Project Override → Granular Flags → `resolveToolPermissions()` → `Set<string>`. Permissions re-resolve when `selectedProject` changes.

22. **ProjectPicker filters by accessible projects** — When the permission engine is active and `resolvedPermissions.globalAccess` is false, ProjectPicker only shows projects the user is assigned to via `Project_Team_Assignments`. Users with `globalAccess: true` (e.g., President/VP, OpEx Manager) see all projects.

23. **MockDataService defaults to ExecutiveLeadership** — The `_currentRole` field in MockDataService defaults to `RoleName.ExecutiveLeadership` (not OperationsTeam). This ensures the dev server starts with full admin access for testing the permission engine. The RoleSwitcher shows "President / VP Operations" as the first/default option.

24. **RoleSwitcher labels are enterprise personas, not RoleName values** — The `ROLE_OPTIONS` in `dev/RoleSwitcher.tsx` use business-oriented labels (e.g., "Project Executive" → `OperationsTeam`, "OpEx Manager" → `IDS`, "Read-Only Observer" → `RiskManagement`). The underlying `RoleName` enum values are unchanged.

25. **Dev Super-Admin is NOT a real role** — `DEV_SUPER_ADMIN` is a dev-only sentinel string used by the RoleSwitcher. It is NOT a `RoleName` enum value and must never be sent to production or used in `ROLE_PERMISSIONS`. It grants the union of ALL permissions from every role purely for local testing convenience. The `_isDevSuperAdmin` flag on `MockDataService` is not part of `IDataService`.

26. **ScorecardStatus enum was replaced in Phase 22** — The old 8-value enum (Draft, Submitted, ReturnedForRevision, InCommitteeReview, PendingDecision, Decided, Locked, Unlocked) was replaced with a new 10-value enum. Old → New mapping: Draft→BDDraft, Submitted→AwaitingDirectorReview, ReturnedForRevision→DirectorReturnedForRevision, InCommitteeReview→AwaitingCommitteeScoring. `PendingDecision` and `Decided` were removed (replaced by `Go`, `NoGo`, `Rejected`). New values: `CommitteeReturnedForRevision`, `Rejected`, `NoGo`, `Go`. Any code referencing old enum members will fail at compile time.

27. **Assignment mapping resolution uses 4-tier fallback** — `resolveAssignee(region, sector, type)` in `useAssignmentMappings` resolves via: exact region+sector → exact region+"All Sectors" → "All Regions"+exact sector → "All Regions"+"All Sectors". Always add a fallback "All Regions" + "All Sectors" mapping as a catch-all.

28. **`canSubmit` in useGoNoGo allows null scorecard for new creation flow** — When `activeScorecard` is null (brand new scorecard, not yet saved), `canSubmit` returns `true` if the user has `GONOGO_SUBMIT` permission. This is safe because `handleSubmitForReview` in GoNoGoScorecard.tsx calls `handleSave()` first, which creates the scorecard before submission. Do not add a null guard that would block this flow.

29. **LeadDetailPage edit mode syncs CityLocation from AddressCity** — When saving edits on LeadDetailPage, if `AddressCity` was changed, `CityLocation` is auto-populated from `AddressCity` for backward compatibility with pipeline views and other pages that read `CityLocation`.

30. **AddressCity and AddressState are required on new leads but optional on ILead** — The `validateLeadForm()` validator enforces City and State as required, but the `ILead` interface marks them as optional (`?`) since existing/historical leads may not have these fields populated.

31. **EstimatingKickoffPage uses `id` route param (not `projectCode`)** — The route is `/preconstruction/pursuit/:id/kickoff` where `:id` is the estimating tracker record ID. The component reads `useParams<{ id }>()`, then calls `getRecordById(Number(id))` to look up the `IEstimatingTracker` and get the `ProjectCode`. Never use `projectCode` as a route param — it was a latent bug that has been fixed in Phase 24.

32. **`isLeadSelection` in JobNumberRequestForm checks both URL param AND lead state** — `isLeadSelection = !Number.isFinite(leadId) && !lead`. This ensures Skip mode (no URL param) properly transitions to the main form after `handleNoLeadContinue` sets the `lead` state. Do not revert to checking only `leadId` — that breaks the Skip→Form transition.

33. **siteDetector supports both dashed and dashless project codes** — `ProvisioningService` creates site URLs using `projectCode.replace(/-/g, '')` (e.g., `2504201`). `detectSiteContext()` tries dashed format first (`25-042-01`), then falls back to dashless 7-digit match and re-inserts dashes. When creating test URLs for site detection, use either format — both work.

34. **`isProjectSite` blocks `setSelectedProject(null)`** — On project-specific SP sites, `handleSetSelectedProject` in AppContext ignores null arguments to prevent clearing the auto-detected project. The ProjectPicker shows as locked (read-only static display). This is intentional — project sites should always have their project selected. On hub sites, clearing works normally.

35. **`inviteToProjectSiteGroup` is fire-and-forget** — When creating a project team assignment, the SP group invitation (`inviteToProjectSiteGroup`) is called fire-and-forget (`.catch(console.error)`). Failures should not block assignment creation — the assignment record is the source of truth, and group membership can be retried later. In mock mode, it logs to console only.

36. **PostBidAutopsyForm uses `:id` route param (not `:leadId`)** — The route is `/preconstruction/pursuit/:id/autopsy-form` where `:id` is the lead ID. The component reads `useParams<{ id }>()`. Previously it destructured `{ leadId }` which was a param name mismatch causing the form to always show "No lead specified". Fixed in Phase 28.

37. **FeatureGate `featureName` must exactly match the flag's `FeatureName` string** — `isFeatureEnabled()` does a case-sensitive string comparison against `IFeatureFlag.FeatureName`. Using `"ActiveProjectsDashboard"` when the flag is named `"ExecutiveDashboard"` will silently fail (treated as disabled). Always verify the exact string in `featureFlags.json`. NavigationSidebar items also use `featureFlag` for the same check.

38. **Route-level FeatureGate wraps OUTSIDE ProtectedRoute/ProjectRequiredRoute** — When adding `<FeatureGate>` to routes in App.tsx, it must be the outermost wrapper. If the flag is disabled, the user sees "Page Not Found" immediately without hitting permission checks or project-required checks. Pattern: `<FeatureGate> → <ProjectRequiredRoute> → <ProtectedRoute> → <Component>`. Three pages (MarketingDashboard, ActiveProjectsDashboard, PipelinePage) already have page-level `<FeatureGate>` wrappers and don't need route-level ones — adding both would be redundant but not harmful.

39. **`provisionSiteWithFallback()` fallback chain order** — The three-tier fallback in `ProvisioningService.provisionSiteWithFallback()` runs: (1) PowerAutomate if `usePowerAutomate=true`, (2) local `provisionSite()` 7-step engine, (3) OfflineQueue enqueue. In mock mode, `usePowerAutomate` defaults to `false`, so tier 1 is always skipped and tier 2 runs (identical to pre-Phase 29 behavior). Do not set `usePowerAutomate=true` unless a real PowerAutomate endpoint is configured.

40. **`featureFlagName` on IWorkflowStep must match exact `FeatureName` string** — The `resolveWorkflowChain()` feature flag check in MockDataService uses `this.featureFlags.find(f => f.FeatureName === step.featureFlagName)` — case-sensitive exact match. If the flag name doesn't exist in `featureFlags.json`, the step defaults to **enabled** (safe default). Always verify the flag name exists before adding it to a workflow step.

41. **`Group.ReadWrite.All` Graph scope required for `addGroupMember()`** — The `GraphService.addGroupMember()` method (Phase 27) calls `POST /groups/{id}/members/$ref` which requires `Group.ReadWrite.All`. The original `Group.Read.All` scope is insufficient for write operations. Both scopes are now declared in `config/package-solution.json`. Admin consent must be granted for both scopes in the SharePoint admin center under API access.

42. **Provisioning URLs are hardcoded to `hedrickbrothers.sharepoint.com`** — `ProvisioningService.ts` lines 158 and 259 hardcode the tenant domain `https://hedrickbrothers.sharepoint.com/sites/`. This differs from `DEFAULT_HUB_SITE_URL` in constants.ts which uses `hedrickbrotherscom.sharepoint.com`. Verify the actual tenant domain before production deployment. The URL should be configurable via a service property or app context, not hardcoded.

43. **`initializeContext()` must be called before `getCurrentUser()` on SharePointDataService** — The `getCurrentUser()` implementation reads `_pageContextUser` which is set by `initializeContext()`. If `initializeContext()` is not called (e.g., if WebPart.onInit() is modified incorrectly), `getCurrentUser()` throws `'SharePointDataService.initializeContext() must be called before getCurrentUser()'`. The `initializeContext()` call must happen after `spService.initialize(sp)` and before the service is used.

44. **`dataServiceMode` property controls Mock vs SharePoint service** — The web part property `dataServiceMode` in `IHbcProjectControlsWebPartProps` defaults to `undefined` (mock mode). Only `'sharepoint'` triggers `SharePointDataService` creation. To deploy to SharePoint with live data, set this property to `'sharepoint'` in the web part configuration. In the SPFx workbench and dev server, it remains in mock mode by default.

45. **All Pattern A stubs now log `[STUB]`** — Every silent-return stub in `SharePointDataService` (returning `[]`, `null`, or empty objects) now emits `console.warn('[STUB] methodName not implemented')`. This makes it easy to identify stub responses in the browser console during SharePoint testing. Filter console for `[STUB]` to see all unimplemented features being hit. Pattern B stubs (mutations) throw `Error('SharePoint implementation pending: methodName')`.

46. **useGoNoGo and usePermissionEngine callbacks are now error-protected** — All dataService calls in `useGoNoGo.ts` (12 callbacks) and `usePermissionEngine.ts` (12 callbacks) are wrapped in try/catch. Read-only methods catch and return empty/null without re-throwing. Mutation methods catch, set `error` state, and re-throw so calling components can also handle the error. This converts unhandled promise rejections (page crashes) into graceful error states.

47. **GraphService audit logger must be wired after dataService creation** — `graphService.setAuditLogger()` is called in `WebPart.onInit()` after both the GraphService is initialized and `this._dataService` is created. The callback passes `(entry) => this._dataService.logAudit(entry)`. If the audit logger is not set, Graph API calls still work — they just don't produce audit records. In mock mode (no GraphService initialization), the logger is never set and this is fine.

48. **Graph API scopes reduced from 10 to 8 in Phase 32** — `User.Read.All` and `Sites.ReadWrite.All` were removed from `config/package-solution.json` because no code path used them. If future features need directory user lookups (e.g., real AzureADPeoplePicker), re-add `User.Read.All` and request admin consent. If future features need cross-site PnP writes (e.g., writing to a project site from hub context), re-add `Sites.ReadWrite.All`.

49. **BD Leads folder operations target a different SP site** — `createBdLeadFolder`, `checkFolderExists`, `createFolder`, `renameFolder` use `Web([this.sp.web, BD_LEADS_SITE_URL])` to access the PX Portfolio Dashboard site. SPFx context tokens are tenant-scoped, so cross-site PnP calls work without additional auth. The folder hierarchy is: `BD Leads / {year} / {leadTitle} - {originatorName} / {9 subfolders}`.

50. **`rekeyProjectCode` only updates hub-level lists** — 6 hub lists are updated via batch (Leads_Master, Estimating_Tracker, Marketing_Project_Records, Provisioning_Log, Buyout_Log, Project_Team_Assignments). 17 project-site lists require manual admin operation since the site URL contains the project code. Future enhancement: accept new site URL and use `Web()` factory to batch-update project lists.

51. **`promoteToHub` requires `_projectSiteUrl` to be set** — Reads `Lessons_Learned` from the project site via `Web([this.sp.web, _projectSiteUrl])`. Falls back with `console.warn` if `_projectSiteUrl` is null (lessons copy skipped, PMP close still runs). Ensure `setProjectSiteUrl()` is called before `promoteToHub()`.

52. **`updateProvisioningLog` is called ~14 times per provisioning run** — Each invocation does find-by-projectCode + update + re-read (3 SP calls). Acceptable for current volume (<50 projects). For high-volume scenarios, consider caching the item ID after `triggerProvisioning`.

53. **Workflow definitions require 3-list assembly** — `getWorkflowDefinitions`/`getWorkflowDefinition` read from `Workflow_Definitions`, `Workflow_Steps`, and `Workflow_Conditional_Assignments`, then assemble nested objects. JSON fields (`DefaultAssignee`, `Conditions`, `Assignee`) must be parsed with safe try/catch fallbacks. `getWorkflowDefinitions()` reads all 3 lists in parallel for efficiency; `getWorkflowDefinition()` filters by `WorkflowKey` first, then reads only related steps/conditionals.

54. **`setWorkflowStepOverride` is an upsert** — Deletes existing override for the same `projectCode+stepId` combination (via filter + recycle) before adding the new one. This prevents duplicate overrides for the same step on the same project.

55. **`resolveWorkflowChain` reads from 7 data sources** — Workflow_Definitions, Workflow_Steps, Workflow_Conditional_Assignments, Workflow_Step_Overrides, Team_Members, Leads_Master, Feature_Flags. All reads are from hub site lists except Team_Members (project site if `_projectSiteUrl` set). Resolution logic matches MockDataService: Override → ProjectRole (team member lookup) → NamedPerson (condition evaluation by priority → default) with feature flag gating (skip/omit).

56. **Startup Checklist requires 2-list join** — `getStartupChecklist` reads from `Startup_Checklist` + `Checklist_Activity_Log` in parallel, groups activity entries by `checklistItemId` into a Map, then attaches to each checklist item. Activity entries are written as part of `updateChecklistItem` (writes the latest entry from `data.activityLog`).

57. **Marketing Project Records has 88 SP columns** — Updates use `buildMarketingUpdateData()` reverse mapper that only includes fields present in `data` to avoid overwriting unchanged data. JSON array fields (`contractType`, `renderingUrls`, `finalPhotoUrls`, `sectionCompletion`) are JSON.stringify'd on write and parsed on read with safe try/catch fallbacks.

58. **`updateTeamRoleAssignment` is an upsert** — Checks if record exists for `projectCode+roleAbbreviation`, creates if missing, updates if found. Returns the final state without re-reading (fields are known from input).

59. **Matrix/Checklist remove methods use SP recycle** — `removeChecklistItem`, `removeInternalMatrixTask`, `removeOwnerContractArticle`, `removeSubContractClause` use `.recycle()` for soft delete (items go to SP recycle bin), matching MockDataService behavior.

60. **`_getProjectWeb()` enables cross-site project list access** — Returns `Web([this.sp.web, this._projectSiteUrl])` when `_projectSiteUrl` is set, otherwise falls back to `this.sp.web`. All Chunk 4 project-site methods (checklist, matrices) use this helper. Hub-site methods (marketing records) use `this.sp.web` directly.

61. **makeStyles vs inline `style={{}}` decision rule** — Use `makeStyles` for all structural styles (layout, spacing, borders, fonts, hover states, transitions). Keep inline `style={{}}` ONLY for truly data-driven values that change per-item: colors from props (e.g., StageBadge backgroundColor from `STAGE_COLORS[stage]`), computed widths (e.g., sidebar width from responsive breakpoint), per-column table widths. If a style value is constant, it belongs in makeStyles, not inline.

62. **Use `tokens.*` before `HBC_COLORS.*` for standard semantic colors** — When a Fluent semantic token matches the intent, prefer it over hardcoded `HBC_COLORS.*`. Examples: `tokens.colorNeutralBackground1` (not `HBC_COLORS.white`), `tokens.colorNeutralForeground3` (not `HBC_COLORS.gray500`), `tokens.colorStatusSuccessForeground1` (not hardcoded green). Reserve `HBC_COLORS.*` for: brand identity (navy, orange), score tiers, and colors with no Fluent equivalent.

63. **TRANSITION constant must be imported from tokens.ts** — `TRANSITION` (`{ fast: '150ms ease', normal: '250ms ease', slow: '350ms ease' }`) was added to `theme/tokens.ts` alongside `ELEVATION`. Use `TRANSITION.fast` for hover effects and chevron rotations, `TRANSITION.normal` for card elevation changes, `TRANSITION.slow` for panel slides. Always import from `'../../theme/tokens'` (or appropriate relative path), never inline transition strings.

64. **`mergeClasses()` for conditional class names** — Use `mergeClasses()` from `@fluentui/react-components` instead of ternary style objects or string concatenation. Pattern: `mergeClasses(styles.base, isActive ? styles.active : styles.inactive)`. Pass `undefined` (not empty string) for absent classes: `mergeClasses(styles.btn, isDisabled ? styles.disabled : undefined)`.

65. **`jsx: "react-jsx"` in tsconfig.json** — The automatic JSX transform is enabled. React 18.2.0 supports this natively via `react/jsx-runtime`. Existing `import * as React from 'react'` imports remain valid and should NOT be removed (they're needed for hooks like `React.useState`). New files can omit the React import if they don't use hooks or `React.*` references, but this is not required.

66. **npm `overrides` required for React 18 with SPFx 1.21.1** — SPFx 1.21.1 packages declare `peerDependencies: { "react": "<18.0.0" }`. The `overrides` block in `package.json` forces npm to accept React 18.2.0. If a new `@microsoft/sp-*` package is added to dependencies, it may also need an entry in `overrides` to avoid peer dep install failures. The `$react` syntax means "use the version from root dependencies."

67. **`createRoot` lifecycle in WebPart** — `HbcProjectControlsWebPart` stores a `private _root: Root | null` field. `createRoot(this.domElement)` is called lazily on first `render()` and reused on subsequent renders (SPFx calls `render()` on property pane changes). `onDispose()` calls `this._root?.unmount()` then nulls the reference. Never call `ReactDOM.render()` or `ReactDOM.unmountComponentAtNode()` — these are removed in React 19 and deprecated in React 18.

68. **`@testing-library/react` v14 for React 18** — `@testing-library/react@^12` has a peer dep on `react-dom <18.0.0`. The project uses `^14.0.0` which supports React 18. If writing tests, use `render()` from `@testing-library/react` — it internally uses `createRoot`. Do not import `react-dom/client` in test files.

69. **All page components are lazy-loaded — never import them statically in App.tsx** — Every page in `pages/hub/`, `pages/precon/`, and `pages/project/` is loaded via `React.lazy()` in App.tsx. When adding a new page route, use the `lazyNamed()` helper (e.g., `const NewPage = lazyNamed(() => import('./pages/hub/NewPage'))`). Never add a static `import { NewPage } from './pages/hub/NewPage'` — this defeats code splitting and pulls the page into the main bundle.

70. **`lazyNamed()` helper picks the first exported key** — The `lazyNamed()` utility in App.tsx resolves named exports for `React.lazy()` by taking `Object.keys(mod)[0]`. This works because each page file has a single primary export. If a page file exports multiple components (e.g., a page + a sub-component), the helper will pick whichever comes first alphabetically. Keep page files to a single export, or use a direct `React.lazy(() => import(...).then(m => ({ default: m.SpecificExport })))` pattern.

71. **`React.Suspense` boundary is inside `AppShell`, not outside it** — The `<React.Suspense fallback={<PageLoader />}>` wraps only `<Routes>` inside `AppRoutes`, not the entire app. This means the sidebar, header, and navigation remain visible during chunk loading — users see a spinner in the content area only. Do not move the Suspense boundary above `<AppShell>` as this would flash the entire page.

72. **AccessDeniedPage and NotFoundPage are NOT lazy-loaded** — These two tiny pages remain in the main bundle (static import / inline). AccessDeniedPage is the redirect target for ProtectedRoute failures — it must be available synchronously. NotFoundPage is the `*` catch-all fallback. Do not lazy-load either.

73. **All data layer imports use `from '@hbc/sp-services'`** — After the Lib-1 extraction, models, services, utils, and mock data live in `packages/hbc-sp-services/src/`. App components import everything from the package barrel: `import { ILead, MockDataService, formatCurrency } from '@hbc/sp-services'`. Never use relative paths like `../../models` or `../../services` — those directories no longer exist in the app. The old path aliases (`@services/*`, `@models/*`, `@utils/*`) have been removed from tsconfig.

74. **New data layer files go in `packages/hbc-sp-services/src/`, not in the app** — When adding new models (`I*.ts`), service methods, utility functions, or mock JSON files, create them in the package directory (`packages/hbc-sp-services/src/models/`, `services/`, `utils/`, `mock/`). Update the package barrel export (`packages/hbc-sp-services/src/index.ts`) or the appropriate sub-barrel (`models/index.ts`, `services/index.ts`). The app (`src/webparts/`) contains only UI components, hooks, contexts, guards, layouts, and theme.

75. **Build library before app for production** — The root `npm run build` chains `build:lib` then `build:app`. In development, the webpack dev server resolves `@hbc/sp-services` directly to package source (no compilation needed). But for SPFx production builds (`gulp bundle --ship`), the library must be compiled first: `cd packages/hbc-sp-services && npm run build`. The `build:lib` script handles this.

76. **`MOCK_USERS` is exported from the package barrel for UI components** — `AzureADPeoplePicker.tsx` needs the mock users list for its dropdown. It imports `MOCK_USERS` from `@hbc/sp-services` (which re-exports the default from `mock/users.json`). If other UI components need direct access to mock data, add similar named exports to the package `index.ts` rather than importing JSON files with relative paths.

77. **Root tsconfig `rootDir` is `"."` not `"src"`** — Changed from `"src"` to `"."` to accommodate TypeScript path alias resolution into `packages/hbc-sp-services/src/`. If `rootDir` is set to `"src"`, TypeScript throws TS6059 errors because files resolved via the `@hbc/sp-services` alias are outside the root directory. Do not revert this.

78. **`npm install` required after workspace changes** — After any change to root `package.json` `workspaces` array or after cloning the repo, run `npm install` to create the `node_modules/@hbc/sp-services` symlink. Without this symlink, the SPFx `gulp bundle --ship` build will fail with `Cannot find module '@hbc/sp-services'`. The dev webpack server (`npm run dev`) masks this issue because it resolves via a direct webpack alias. Additionally, the library must be compiled (`npm run build:lib`) before the SPFx production build — the `npm run build` script chains this automatically. The `.npmrc` file sets `legacy-peer-deps=true` to handle SPFx `@types/react <18.0.0` peer dep conflicts with React 18.

79. **`gulpfile.js` has `@hbc/sp-services` webpack alias** — The SPFx build pipeline (`@microsoft/sp-build-web`) generates its own webpack config that does NOT inherit tsconfig path aliases or dev webpack aliases. `build.configureWebpack.mergeConfig()` in `gulpfile.js` adds the `@hbc/sp-services` → `packages/hbc-sp-services/src` alias so `gulp serve` and `gulp bundle --ship` can resolve the workspace package imports.

---

## Audit Log

| Date | Sections Changed | What Changed |
|------|-----------------|--------------|
| 2026-02-09 | §3, §15 | §3: Fixed route count from 47 to 48 (App.tsx has 48 Route elements). §15: Merged monthly review into Phase 10 summary (it was built alongside other operational modules, not as a separate phase). Relabeled Phase 11 from "Monthly project review" to "Data Strategy Refactor" (flattened mock data, columnMappings.ts, DATA_ARCHITECTURE.md, PERMISSION_STRATEGY.md). Added known gap: NavigationSidebar.tsx does not yet reflect Phase 12 design (Closeout under Project Manual, Project Record sub-group). All other sections (§1-§2, §4-§14, §16) validated against source files with no discrepancies found. |
| 2026-02-09 | §2, §3, §5, §6, §7, §10, §11, §12, §13, §15 | Phase 13: Added workflow definition configuration. 4 new workflows (Go/No-Go, PMP, Monthly Review, Commitment) with 14 steps. AdminPanel expanded to 6 tabs. 10 new IDataService methods (152 total). 3 new enums, 6 new enum values. 4 new shared components, 1 new hook, 1 new page. |
| 2026-02-09 | §2, §6, §7, §10, §12, §13, §15 | Phase 15: Turnover to Ops Meeting Agenda. TurnoverToOps.tsx rewritten as two-tab module (Meeting Agenda + Follow-Up Checklist). 9 new interfaces (ITurnoverAgenda + 8 sub-interfaces). 17 new IDataService methods (169 total). 1 new enum (TurnoverStatus), 10 AuditAction values, 1 EntityType, 1 WorkflowKey. 2 new permissions (turnover:agenda:edit, turnover:sign). 7 new PROJECT_LISTS. 7 new column mappings. 5th workflow (TURNOVER_APPROVAL). New files: ITurnoverAgenda.ts, turnoverAgendaTemplate.ts, turnoverAgendas.json, useTurnoverAgenda.ts. |
| 2026-02-09 | §2, §6, §7, §13, §15 | Phase 16: Hub Site Navigation Link Provisioning. Added HubNavigationService.ts to services. IProvisioningLog updated with hubNavLinkStatus field. 1 new type alias (HubNavLinkStatus). 5 new AuditAction enum values (HubNavLinkCreated, HubNavLinkFailed, HubNavLinkRetried, HubNavLinkRemoved, HubSiteUrlUpdated). 2 new IDataService methods (171 total): getHubSiteUrl (implemented), setHubSiteUrl (stub). Added DEFAULT_HUB_SITE_URL constant. SharePointDataService: 49 implemented, 122 stubs. HubNavigationService SP stub added to known stubs. |
| 2026-02-09 | §2, §6, §7, §15, §16 | Phase 17: Scorecard Unlock Fix, Director Role & Action Inbox. Bug fixes in useGoNoGo: canUnlock checks approval chain participants OR Executive Leadership (was GONOGO_DECIDE only); canReview/canEnterCommitteeScores/canDecide now grant access to Executive Leadership role regardless of email match (fixes mock dev user email mismatch with workflow step assignees). New model: IActionInboxItem (models/IActionInbox.ts). 2 new enums: WorkflowActionType (8 values), ActionPriority (3 values). 1 new IDataService method (172 total): getActionItems. New hook: useActionInbox (auto-refresh 5min). DashboardPage: Action Inbox section between filters and KPI cards. SharePointDataService: 49 implemented, 123 stubs. |
| 2026-02-09 | §15, §16 | Phase 17 bug fixes: MockDataService.getCurrentUser() now returns first real user from users.json matching selected role (was hardcoded 'devuser@hedrickbrothers.com'). Role-to-user mapping: BD Rep=Sarah Mitchell (smitchell), Exec=Mike Hedrick (mhedrick), etc. submitScorecard() looks up submitter displayName from users list. respondToScorecardSubmission() defensively reassembles approval cycles from flat arrays if missing. Added pitfall #13 (getCurrentUser real users) and #14 (Executive Leadership role fallback). |
| 2026-02-09 | §6, §10, §15, §16 | Phase 18: Department Director Role + Go/No-Go Workflow Bug Fixes. Added DepartmentDirector to RoleName enum (13th role). New ROLE_PERMISSIONS entry (operational subset of Executive Leadership — NO admin access). NAV_GROUP_ROLES updated (Marketing, Preconstruction, Operations — NOT Admin). useGoNoGo.ts: isExecLeadership→isDirectorOrExec (5 locations). Mock users.json: David Park role changed from Executive Leadership to Department Director. RoleSwitcher: +1 option. 7 page files updated with DepartmentDirector in RoleGate arrays. NotificationService: 18 recipient arrays updated. MockDataService bug fixes: relockScorecard creates approval cycle for startNewCycle=true; getScorecardByLeadId/getScorecards return reassembled scorecards; updateScorecard preserves workflow state fields; 4 defensive status guards added. RBAC table expanded to 13 columns. Added pitfalls #15-#17. |
| 2026-02-10 | §2, §6, §7, §10, §11, §12, §13, §15, §16 | Phase 19A: Core Permission Engine. Added template-based authorization with 23-tool permission map, project access scoping, feature-flagged resolution chain. 9 new interfaces (IPermissionTemplate + related). 15 new IDataService methods (187 total). 3 new mock data files. PermissionLevel enum. 8 AuditAction + 2 EntityType values. 3 new HUB_LISTS. 3 new permission keys. PermissionEngine feature flag (id: 23). AppContext integration with resolvedPermissions + re-resolution on project change. ProjectPicker accessible project filtering. |
| 2026-02-10 | §2, §5, §15 | Phase 19B: Permission Engine Admin UI. 4 new components (PermissionTemplateEditor, ToolPermissionMatrix, GranularFlagEditor, ProjectTeamPanel). AdminPanel expanded to 7 tabs. ProjectDashboard gains ProjectTeamPanel section (FeatureGated). |
| 2026-02-10 | §6, §7, §12, §15 | Phase 19C: Environment Architecture. IPermissionTemplate gains version + promotedFromTier. IEnvironmentConfig expanded with promotionHistory + IPromotionRecord. 2 new service methods (189 total): getEnvironmentConfig, promoteTemplates. New mock file environmentConfig.json. AppShell env badge (DEV/UAT). PermissionTemplateEditor promote button. |
| 2026-02-10 | §2, §6, §7, §12, §13, §15 | Phase 19D: Flexible Sectors + Identity. New ISectorDefinition model + sectorDefinitions.json (12 entries). 3 new service methods (192 total): getSectorDefinitions, createSectorDefinition, updateSectorDefinition. Sector enum deprecated. ICurrentUser gains identityType. AdminPanel Sectors tab (8th tab). LeadFormPage, PipelinePage, ConditionBuilder use dynamic sectors when PermissionEngine enabled. New hook useSectorDefinitions. |
| 2026-02-10 | §10, §16 | Permission Engine activation polish: RoleSwitcher enterprise hierarchy labels (seniority-ordered, persona names). IDS (OpEx Manager) gains permission:templates:manage, permission:project_team:manage, permission:project_team:view. toolPermissionMap admin_panel ADMIN level gains permission engine keys. MockDataService default role → ExecutiveLeadership. resolveUserPermissions console.log for debugging. |
| 2026-02-10 | §6, §10, §12, §15, §16 | Phase 20: SharePoint Admin Role + Dev Super-Admin. Added 14th RoleName (SharePointAdmin). ROLE_PERMISSIONS entry with `...Object.values(PERMISSIONS)` (ALL permissions). NAV_GROUP_ROLES: SharePoint Admin added to all 4 groups (Marketing, Preconstruction, Operations, Admin). Dev Super-Admin mode: union of ALL role permissions (dev-only, not a real role). MockDataService: +_isDevSuperAdmin +setDevSuperAdminMode, getCurrentUser super-admin branch, resolveUserPermissions super-admin short-circuit + 'SharePoint Admin' in roleToGroupMap. RoleSwitcher widened to RoleValue union type with 15 options + red pill badge. dev/index.tsx super-admin detection. mockContext.ts default fixed to ExecutiveLeadership. users.json +Alex Torres (id:25). permissionTemplates.json +id:9 (SharePoint Admin, all 23 tools at ADMIN). securityGroupMappings.json +id:9. |
| 2026-02-10 | §3, §8, §9, §10, §13, §15 | Phase 21: Preconstruction Navigation Cleanup. Preconstruction nav 10→7 items (removed Precon Tracker, Estimate Log, Accounting Queue). New Accounting nav group (Acct Mgr, Exec, Dept Dir, SP Admin). Go/No-Go Tracker moved from EstimatingDashboard tab 3 to PipelinePage tab 1. PipelinePage now 2-tab (Pipeline + Go/No-Go Tracker). EstimatingDashboard now 3-tab. /preconstruction/gonogo backward compat→PipelinePage. Route count 48→49. NAV_GROUP_ROLES +Accounting. ROUTES +PRECON_PIPELINE_GONOGO. |
| 2026-02-11 | §2, §6, §7, §10, §12, §13, §15, §16 | Phase 22: Lead-to-Site Workflow Enhancement. ScorecardStatus replaced (8→10 values: BDDraft, AwaitingDirectorReview, DirectorReturnedForRevision, AwaitingCommitteeScoring, CommitteeReturnedForRevision, Rejected, NoGo, Go, Locked, Unlocked). New IAssignmentMapping model + assignmentMappings.json (4 entries) + useAssignmentMappings hook. 8 new IDataService methods (200 total): createBdLeadFolder, checkFolderExists, createFolder, renameFolder, getAssignmentMappings, createAssignmentMapping, updateAssignmentMapping, deleteAssignmentMapping. +3 AuditAction (ScorecardArchived, LeadFolderCreated, AssignmentMappingUpdated), +7 NotificationEvent (ScorecardSubmittedToDirector, ScorecardReturnedByDirector, ScorecardRejectedByDirector, ScorecardAdvancedToCommittee, ScorecardApprovedGo, ScorecardDecidedNoGo, EstimatingCoordinatorNotifiedGo), +1 EntityType (AssignmentMapping). +2 permissions (gonogo:review, admin:assignments:manage). GoNoGoScorecard.tsx rewritten with Save/Submit, Director review/reject, Committee Go/NoGo/Return, archive flow. PipelinePage.tsx Go/No-Go Tracker with Pending/Archive sub-tabs + advanced filters. LeadFormPage.tsx +BD Leads folder creation. JobNumberRequestForm.tsx +optional lead association. EstimatingDashboard.tsx +Request New Project Number button. AdminPanel.tsx +Assignment Mappings CRUD. scorecards.json updated to new status values. Added pitfalls #26-#27. |
| 2026-02-11 | §6, §10, §15, §16 | Phase 23: BD Representative UX Enhancements. ILead.ts: +AddressStreet, +AddressCity, +AddressState, +AddressZip, +DateSubmitted; -ProjectAddress. validators.ts: +AddressCity/AddressState required. LeadFormPage.tsx: address field grid with US_STATES dropdown, CityLocation auto-populate, DateSubmitted auto-set. LeadDetailPage.tsx: full edit mode (all fields become editable inputs, +address section, +Notes). PipelinePage.tsx: +DateSubmitted "Created" column, default sort newest-first. useGoNoGo.ts: canSubmit allows null scorecard. permissions.ts: BD Rep +6 permissions (marketing:dashboard:view, marketing:edit, projectrecord:edit, precon:hub:view, autopsy:edit, autopsy:schedule), BD Rep added to Marketing nav group. leads.json: +4 address fields on all 29 records. columnMappings.ts: +5 new mappings (address fields + DateSubmitted), -ProjectAddress. AccountingQueuePage.tsx and MockDataService.ts: removed ProjectAddress references from ILead context. Added pitfalls #28-#30. |
| 2026-02-11 | §5, §6, §7, §9, §10, §12, §15, §16 | Phase 24: Estimating Coordinator UX Enhancements. EC redirect to /preconstruction on login (DashboardPage.tsx). Removed Kick-Off Checklists from NavigationSidebar. Inline-editable dashboard tables (3 tabs, ~30 columns with InlineInput/InlineNumber/InlineDate/InlineSelect React.memo helpers in EstimatingDashboard.tsx). Current Pursuits: auto-width text columns, stripped parenthetical checkbox headers, row-click→kickoff, removed Kick-Off button column. EstimatingKickoffPage: fixed route param bug (`:id` not `:projectCode`), lead selector dropdown, Key Personnel section with AzureADPeoplePicker, Estimating Checklist with multi-select assignees, role-filtered Pursuit Tools. AzureADPeoplePicker: discriminated union props for multiSelect (pills, toggle select, checkmarks). PursuitDetail: removed Estimating Kickoff button, EC role filtering (4 tools vs 5). New model: IKeyPersonnelEntry. IEstimatingKickoff: +keyPersonnel field. IEstimatingKickoffItem: +assignees field. 1 new IDataService method (201 total): updateKickoffKeyPersonnel. EC GONOGO_SCORE_ORIGINATOR permission removed. Added pitfall #31 (EstimatingKickoffPage route param). |
| 2026-02-11 | §15, §16 | Phase 25: Job Number Request Form Alignment. Fixed Skip mode transition bug (isLeadSelection now checks `&& !lead`). Expanded noLeadMode entry from 3→6 fields (added Division select, Sector select, ProjectValue input). 2-column grid layout. Main form header shows Division/Sector/Region/ProjectValue context. No IJobNumberRequest model changes. No service/hook/mock data changes. Single file modified: JobNumberRequestForm.tsx. Added pitfall #32. |
| 2026-02-11 | §3, §4, §5, §7, §9, §15, §16 | Phase 26: Project Selection Behavior. Wired `siteDetector.ts` into app — `detectSiteContext()` → AppContext `isProjectSite` flag. WebPart passes `pageContext.web.absoluteUrl` as `siteUrl` prop. AppProvider computes site context, auto-selects project on project-specific SP sites via `searchLeads()`. `ISelectedProject` gains `siteUrl?` field. `IAppContextValue` gains `isProjectSite` boolean. `handleSetSelectedProject` blocks null on project sites. ProjectPicker gains `locked?` prop — shows read-only static display when true. NavigationSidebar: `hubOnly` flag on 10 multi-project nav items, dynamic Lead Detail + Go/No-Go items under Preconstruction when project selected. `setProjectSiteUrl()` added to IDataService (method #202): no-op in Mock, stores URL in SharePointDataService for future dual-web PnP. `siteDetector.ts` dashless project code regex fix (7-digit `2504201` → `25-042-01`). AppContext effect calls `setProjectSiteUrl()` on selectedProject changes. Added pitfalls #33 (dashless siteDetector) and #34 (isProjectSite blocks null). |
| 2026-02-11 | §2, §7, §15, §16 | Phase 27: Admin Project Assignments. Hub-level project-user assignment panel in AdminPanel 9th tab ("Assignments"). 2 new IDataService methods (204 total): `getAllProjectTeamAssignments` (returns all active assignments), `inviteToProjectSiteGroup` (fire-and-forget SP group invite, console.log in mock). `addGroupMember(groupId, userId)` added to IGraphService + GraphService class. `usePermissionEngine` hook extended with `getAllAssignments` and `inviteToSiteGroup`. `ProjectAssignmentsPanel.tsx`: Project-grouped layout — main DataTable of projects (code, name, team count badge) with expand/collapse chevrons; expanded section shows per-project assignment sub-DataTable + inline batch-add form (multi-select AzureADPeoplePicker, role select, template override, sequential await per user); search bar filters projects by name/code; total assignment count badge; useActiveProjects for project name enrichment. Permission-gated by `permission:project_team:manage`. Added pitfall #35 (inviteToProjectSiteGroup fire-and-forget). |
| 2026-02-11 | §10, §15, §16 | Phase 28: Post-Bid Autopsy Create Button. Added "Create New Autopsy Report" button to PostBidAutopsyList PageHeader with inline lead selector dropdown (eligible ArchivedLoss leads without existing autopsy). New permission `autopsy:create` added to PERMISSIONS constant and 4 ROLE_PERMISSIONS entries (BD Rep, Est Coord, Exec, Dept Dir; SP Admin inherits via spread). Bug fix: PostBidAutopsyForm `useParams` destructure changed from `{ leadId }` to `{ id }` to match route param `:id`. Added pitfall #36. |
| 2026-02-11 | §6, §9, §11, §12, §15, §16 | Phase 28A: Feature Flags Admin Enhancement. Added `FeatureFlagCategory` type alias (5 categories: Core Platform, Preconstruction, Project Execution, Infrastructure, Integrations). `IFeatureFlag` gains optional `Category` field. `featureFlags.json` updated with Category on all 23 entries. `columnMappings.ts` +Category on FEATURE_FLAGS_COLUMNS. AdminPanel Feature Flags tab rewritten: grouped by Category using CollapsibleSection with count badge ("N of M enabled"). NavigationSidebar: `INavItem` gains optional `featureFlag` field; `isItemVisible()` checks `isFeatureEnabled()` before permission/hubOnly checks; 11 nav items mapped to flags (Pipeline→PipelineDashboard, Go/No-Go Tracker→GoNoGoScorecard, Post-Bid Autopsies→LossAutopsy, New Lead→LeadIntake, Marketing Dashboard→MarketingProjectRecord, Project Record→MarketingProjectRecord, Active Projects→ExecutiveDashboard, Startup Checklist→ProjectStartup, Responsibility→ProjectStartup, Management Plan→ProjectManagementPlan, Monthly Review→MonthlyProjectReview). Fixed ActiveProjectsDashboard FeatureGate bug: `"ActiveProjectsDashboard"` → `"ExecutiveDashboard"`. Added pitfall #37 (FeatureGate featureName case-sensitive match). |
| 2026-02-12 | §6, §8, §9, §11, §15, §16 | Phase 28B: Feature Flag Route-Level Enforcement & Display Names. `DisplayName: string` added to IFeatureFlag interface. featureFlags.json updated with human-readable DisplayName on all 23 entries (e.g., "GoNoGoScorecard" → "Go/No-Go Scorecard"). columnMappings.ts +DisplayName on FEATURE_FLAGS_COLUMNS. AdminPanel: flag table column, confirm dialog, and audit log detail all show DisplayName instead of FeatureName. App.tsx: FeatureGate imported from guards; 20 routes wrapped with `<FeatureGate featureName="X" fallback={<NotFoundPage />}>` — LeadIntake (1 route), GoNoGoScorecard (3 routes), PipelineDashboard (3 routes), LossAutopsy (3 routes), EstimatingTracker (3 routes), TurnoverWorkflow (1 route), ProjectStartup (4 routes), ProjectManagementPlan (1 route), MonthlyProjectReview (1 route). FeatureGate wraps outermost (outside ProtectedRoute/ProjectRequiredRoute). NavigationSidebar: +featureFlag: 'EstimatingTracker' on 3 items (Estimating Dashboard, Precon Tracker, Estimate Log). §8 routes table gains Feature Gate column. Added pitfall #38 (FeatureGate wrapping order). |
| 2026-02-12 | §2, §6, §15, §16 | Phase 29: Site Provisioning Workflow Enhancements. 4 enhancements: (A) Project Setup Tracker widget on DashboardPage — useProvisioningTracker hook with 10s auto-refresh, 7-dot step progress, summary KPI chips, RoleGate + FeatureGate, retry for failed items; (B) useProvisioningValidation hook composing validators.ts + async duplicate-provisioning check, integrated into JobNumberRequestForm replacing local validate(); (C) ProvisioningService.provisionSiteWithFallback() three-tier fallback (PowerAutomate → local → offline queue), transparent in mock mode; (D) featureFlagName + isSkippable on IWorkflowStep, skipped + skipReason on IResolvedWorkflowStep, MockDataService resolveWorkflowChain feature flag gating, WorkflowStepCard purple flag badge, WorkflowPreview skipped step styling. 2 new hooks, 10 modified files. +2 new fields on IWorkflowStep, +2 on IResolvedWorkflowStep. +2 column mappings (WORKFLOW_STEPS_COLUMNS). GO_NO_GO step 2 (Precon Director Review) gets featureFlagName:"MeetingScheduler" + isSkippable:true. Added pitfalls #39-#40. |
| 2026-02-12 | §15, §16 | Phase 30: SPFx Deployment Readiness Assessment. Created docs/DEPLOYMENT_READINESS.md (comprehensive report: MVD scope, 5-tier remediation, SP list inventory, config checklist). Added Group.ReadWrite.All Graph scope to package-solution.json (10 total). SPFx 1.21.1 alignment confirmed across all 10 packages. SharePointDataService: 50 implemented / 154 stubbed of 204 total. getCurrentUser() identified as P1 deployment blocker. Graph API: 1 missing scope fixed (Group.ReadWrite.All for addGroupMember), 2 unused scopes documented. Provisioning hardcoded URLs flagged (hedrickbrothers vs hedrickbrotherscom domain mismatch). Added pitfalls #41 (Group.ReadWrite.All scope) and #42 (provisioning URL hardcoding). |
| 2026-02-12 | §3, §7, §15, §16 | Phase 31: Tier 0 Deployment Gate Remediation. §3: Updated SPFx Web Part entry point table — added `dataServiceMode` property, `initializeContext()` call, GraphService initialization via `msGraphClientFactory.getClient('3')`. §7: `getCurrentUser` SP column changed from Stub→Impl. §15: Phase 31 entry (4 Tier 0 items), SharePointDataService status updated to 51 implemented / 153 stubbed, Known Stubs updated with [STUB] logging pattern. §16: Added pitfalls #43 (initializeContext before getCurrentUser), #44 (dataServiceMode property), #45 ([STUB] console.warn pattern), #46 (useGoNoGo/usePermissionEngine error protection). Files modified: HbcProjectControlsWebPart.ts, SharePointDataService.ts, useGoNoGo.ts, usePermissionEngine.ts. |
| 2026-02-12 | §1, §3, §6, §15, §16 | Phase 32: Permissions & Security Remediation. §1: package-solution.json Graph scopes 10→8. §3: WebPart.onInit() wires `graphService.setAuditLogger()`. §6: +4 AuditAction (GraphApiCallSucceeded/Failed, GraphGroupMemberAdded/AddFailed), +1 EntityType (GraphApi). §15: Phase 32 entry, pitfalls #47-#48. Files: config/package-solution.json (-User.Read.All, -Sites.ReadWrite.All), GraphService.ts (+audit logging on all 8 methods), ProvisioningService.ts (URL domain fix), enums.ts (+4 AuditAction, +1 EntityType), usePermissionEngine.ts (+audit on inviteToSiteGroup failure), HbcProjectControlsWebPart.ts (+setAuditLogger wiring), services/index.ts (+GraphAuditLogger export), docs/DEPLOYMENT_READINESS.md (scope analysis rewrite, phased consent, resolved items). |
| 2026-02-12 | §2 | Post-Phase 32 Security Analysis. Created docs/SECURITY_ANALYSIS.md — comprehensive permissions & security posture document covering: Graph API scope inventory (8 scopes), audit coverage summary, resolved issues (7 items across Phases 31-32), remaining deployment configuration risks (mock group IDs, PowerAutomate endpoints, admin consent), accepted risks (4 items), phased admin consent strategy (4 phases: MVD→Calendar→Email→Teams), architecture notes. No code changes — documentation only. |
| 2026-02-14 | §7, §15 | SP Service Chunk 1: Permissions & Security. §7: 20 methods changed from SP Stub→Impl (methods 171, 173-189, 202-203). §15: Phase SP-1 entry added. SharePointDataService status updated: 71 implemented / 133 stubs. Known Stubs updated to remove permission-related items. Column Mappings note updated. Files modified: SharePointDataService.ts (+464 lines: 7 new imports, 3 private mapper helpers, 20 method implementations replacing stubs). |
| 2026-02-14 | §7, §15, §16 | SP Service Chunk 2: Provisioning & Infrastructure. §7: 10 methods changed from SP Stub→Impl (methods 34, 36, 38, 121, 141, 142, 193-196). §15: Phase SP-2 entry added. SharePointDataService status updated: 81 implemented / 123 stubs. Known Stubs updated (removed provisioning, folder, re-key, sync, promote). Column Mappings note updated (Provisioning Log). §16: Added pitfalls #49-52 (cross-site folder ops, rekeyProjectCode hub-only, promoteToHub requires projectSiteUrl, updateProvisioningLog call frequency). Files modified: SharePointDataService.ts (+2 imports, 10 stub→implementations), columnMappings.ts (+hubNavLinkStatus). |
| 2026-02-14 | §7, §15, §16 | SP Service Chunk 3: Workflow Definitions. §7: 10 methods changed from SP Stub→Impl (methods 143-152). §15: Phase SP-3 entry added. SharePointDataService status updated: 91 implemented / 113 stubs. Known Stubs updated (removed workflow definitions). Column Mappings note updated (Workflow Definitions 4 lists). §16: Added pitfalls #53-55 (3-list assembly, upsert override, resolveWorkflowChain 7 data sources). Files modified: SharePointDataService.ts (+4 column mapping imports, +2 enum imports, +6 private helpers, 10 stub→implementations). |
| 2026-02-14 | §7, §13, §15, §16 | SP Service Chunk 4: Checklists, Matrices & Marketing Records. §7: 22 methods changed from SP Stub→Impl (methods 56-77). §13: +TEAM_ROLE_ASSIGNMENTS to PROJECT_LISTS. §15: Phase SP-4 entry added. Known Stubs updated (removed checklist, matrices, marketing). Column Mappings note updated (+7 list column mappings in use). §16: Added pitfalls #56-60 (2-list checklist join, 88-column marketing mapper, team role upsert, recycle soft delete, _getProjectWeb helper). Files modified: SharePointDataService.ts (+7 column mapping imports, +1 model import, +8 private helpers incl. _getProjectWeb, 22 stub→implementations), columnMappings.ts (+TEAM_ROLE_ASSIGNMENTS_COLUMNS), constants.ts (+TEAM_ROLE_ASSIGNMENTS). |
| 2026-02-14 | §7, §15 | IDataService method count audit. §7: Total method count corrected from 204→212 (8 methods added in later phases without updating header count). §15: Comprehensive stub audit via grep — corrected counts: 129 implemented, 6 delegation stubs (GraphService/PowerAutomate), 77 pending stubs (21 Pattern A + 56 Pattern B). Total 212. Historical SP chunk entries left as-written; current status sections now reflect audited counts. |
| 2026-02-14 | §1, §4, §13, §15, §16 | Fluent UI v9 Theming + makeStyles Migration. §1: Added Styling row (Griffel makeStyles + Fluent tokens), updated tsconfig description (+jsx react-jsx). §4: Replaced "Inline CSS Pattern" with "Hybrid CSS Pattern" (makeStyles for structural, inline for dynamic, tokens vs HBC_COLORS rules, mergeClasses for conditional). §13: TRANSITION constant added to tokens.ts (fast/normal/slow). §15: Phase Theme-1 entry (hbcTheme 30+ overrides, globalStyles 40+ classes, 10 component conversions, tsconfig jsx transform). §16: Added pitfalls #61-65 (makeStyles vs inline decision rule, tokens before HBC_COLORS, TRANSITION import, mergeClasses pattern, jsx react-jsx). Files modified: hbcTheme.ts, globalStyles.ts, tokens.ts (+TRANSITION), tsconfig.json (jsx: react-jsx), AppShell.tsx, NavigationSidebar.tsx, DataTable.tsx, KPICard.tsx, PageHeader.tsx, SearchBar.tsx, StageBadge.tsx, StatusBadge.tsx, ExportButtons.tsx, LoadingSpinner.tsx. Zero data service or workflow files touched. |
| 2026-02-14 | §1, §3, §15, §16 | React 18.2.0 Migration. §1: React 17.0.1→18.2.0, @testing-library/react ^12.1.5→^14.0.0. §3: WebPart render() uses createRoot + Root lifecycle, dev server uses createRoot. §15: Phase React18 entry (package.json overrides, createRoot in WebPart + dev, zero component changes). §16: Added pitfalls #66-68 (npm overrides for SPFx peer deps, createRoot lifecycle, @testing-library/react v14). Files modified: package.json (react 18.2.0, types 18.2.0, +overrides, @testing-library/react ^14), HbcProjectControlsWebPart.ts (createRoot + Root), dev/index.tsx (createRoot). Zero component, style, data-service, or workflow files touched. |
| 2026-02-14 | §1, §2, §3, §5, §15, §16 | Route-based Code Splitting. §1: +Code Splitting row (React.lazy + Suspense, 40 lazy pages). §2: +PageLoader.tsx in shared/ (34 components). §3: Component tree updated with Suspense(PageLoader), +Code Splitting row. §5: +PageLoader component. §15: Phase Perf-1 entry (40 lazy imports, lazyNamed helper, PageLoader, -2 dead imports). §16: Added pitfalls #69-72 (lazy page imports only, lazyNamed first-key behavior, Suspense inside AppShell, AccessDeniedPage/NotFoundPage not lazy). Files: App.tsx (rewritten — 40 static→lazy imports, +Suspense, +lazyNamed, -GoNoGoTracker/-PreconKickoff dead imports), shared/PageLoader.tsx (new), shared/index.ts (+1 export). Zero route guard, service, model, or styling files touched. |
| 2026-02-14 | §1, §2, §14, §15, §16 | Extract `@hbc/sp-services` Shared Library (Lib-1). §1: +Monorepo row (npm workspaces), updated build commands (build:lib → build:app chain), updated path aliases (-@services/-@models/-@utils, +@hbc/sp-services). §2: Removed models/, services/, utils/, mock/ from app directory tree, added packages/hbc-sp-services/ directory tree, noted moved files. §14: Updated New Feature Workflow to reference package paths for models/services/utils/mock. §15: Phase Lib-1 entry (114 files moved, ~106 files rewritten, 3 new package scaffold files). §16: Added pitfalls #73-77 (@hbc/sp-services imports, new files go in package, build:lib before app, MOCK_USERS export, rootDir constraint). Files created: packages/hbc-sp-services/package.json, tsconfig.json, src/index.ts. Files modified: root package.json (+workspaces, +dependency, +scripts), root tsconfig.json (rootDir "." + new paths), dev/webpack.config.js (new aliases), services/index.ts (added missing exports), ~106 app files (import rewrites), AzureADPeoplePicker.tsx (MOCK_USERS), PursuitDetail.tsx (inline import fix). Directories moved via git mv: models/ → packages/hbc-sp-services/src/models/, services/ → .../services/, utils/ → .../utils/, mock/ → .../mock/. |
| 2026-02-14 | §1, §16 | Fix @hbc/sp-services import resolution. §1: +.npmrc to Key Config Files, updated gulpfile.js description. §16: Added pitfalls #78 (npm install for workspace symlink + .npmrc legacy-peer-deps), #79 (gulpfile.js SPFx webpack alias). Files created: .npmrc (legacy-peer-deps=true). Files modified: gulpfile.js (+build.configureWebpack.mergeConfig with @hbc/sp-services alias), .gitignore (+packages/hbc-sp-services/lib/), package.json (removed broken Fluent UI sub-package overrides that referenced non-existent 9.59.0 versions). npm install now succeeds, creating node_modules/@hbc/sp-services workspace symlink. Library compiles to packages/hbc-sp-services/lib/. |
| 2026-02-14 | §16 | Fixed dev server resolution for React 18 + monorepo after library extraction. Added react/react-dom/react-dom/client webpack aliases and resolve.modules to dev/webpack.config.js. Added react-dom scheduler override to package.json. |
| 2026-02-14 | §1, §16 | Pinned @fluentui/react-icons to exact 2.0.319 (was ^2.0.230). Added webpack alias in dev/webpack.config.js, npm override in root package.json, and workspace package peer/dev dep in packages/hbc-sp-services/package.json to prevent nested module resolution failures. |
| 2026-02-14 | §1, §16 | Hardened monorepo dependency resolution. Replaced overrides block with comprehensive top-level react/react-dom/scheduler pins (prevents SPFx nesting). Added `postinstall` (auto build:lib) and `clean:dev` (nuclear reinstall) scripts. Added scheduler webpack alias. |
