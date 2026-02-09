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

**Last Updated:** 2026-02-09 — Phase 16: Hub Site Navigation Link Provisioning

---

## §1 Tech Stack & Build

| Item | Value |
|------|-------|
| Framework | SharePoint Framework (SPFx) 1.21.1 |
| UI Library | React 17.0.1 |
| TypeScript | ~5.3.3 |
| Component Library | @fluentui/react-components ^9.46.0, @fluentui/react-icons ^2.0.230 |
| Router | react-router-dom ^6.22.3 |
| SP Data | @pnp/sp ^4.4.1, @pnp/graph ^4.4.1 |
| Charts | recharts ^2.12.3 |
| Export | jspdf ^2.5.2, html2canvas ^1.4.1, xlsx ^0.18.5 |
| Build Tool | gulp ^4.0.2, webpack ^5.90.0 |
| Test | jest ^29.7.0, @testing-library/react ^12.1.5 |
| Lint | eslint ^8.57.0, @microsoft/eslint-config-spfx 1.21.1 |
| Node (Volta) | 22.14.0 |
| Node (engines) | >=18.17.1 <19.0.0 |

### Build Commands

```
gulp serve --nobrowser          # SPFx local workbench
gulp bundle --ship              # Production bundle
gulp package-solution --ship    # Create .sppkg
npm run dev                     # Standalone dev server (port 3000)
npm run build                   # bundle --ship + package-solution --ship
npm run test                    # Jest tests
npm run lint                    # ESLint
```

**Important:** Prefix gulp commands with `volta run --node 22.14.0` when needed.

### Key Config Files

| File | Purpose |
|------|---------|
| config/package-solution.json | Solution ID, Graph permissions, skip feature deployment |
| config/serve.json | Port 4321, HTTPS, initial workbench page |
| config/config.json | Bundle entry: ./lib/webparts/hbcProjectControls/HbcProjectControlsWebPart.js |
| tsconfig.json | Target es2017, module esnext, path aliases (@components/*, @services/*, etc.) |
| gulpfile.js | SPFx build, suppresses SASS non-camelCase warning |
| dev/webpack.config.js | Dev server port 3000, REACT_APP_USE_MOCK=true |
| dev/tsconfig.json | Extends root tsconfig, includes dev/**/* |

### TSConfig Path Aliases

| Alias | Target |
|-------|--------|
| @webparts/* | src/webparts/* |
| @components/* | src/webparts/hbcProjectControls/components/* |
| @services/* | src/webparts/hbcProjectControls/services/* |
| @models/* | src/webparts/hbcProjectControls/models/* |
| @hooks/* | src/webparts/hbcProjectControls/components/hooks/* |
| @contexts/* | src/webparts/hbcProjectControls/components/contexts/* |
| @utils/* | src/webparts/hbcProjectControls/utils/* |
| @theme/* | src/webparts/hbcProjectControls/theme/* |

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
│   ├── hooks/                             # 29 custom hooks (see §7 for service method mapping)
│   │   ├── useActiveProjects.ts          # Active projects portfolio
│   │   ├── useBuyoutLog.ts              # Buyout log CRUD
│   │   ├── useCommitmentApproval.ts     # Commitment approval workflow
│   │   ├── useComplianceLog.ts          # Compliance log with filters
│   │   ├── useEstimating.ts             # Estimating tracker CRUD
│   │   ├── useEstimatingKickoff.ts      # Estimating kickoff CRUD + items
│   │   ├── useGoNoGo.ts                 # Go/No-Go scorecards
│   │   ├── useJobNumberRequest.ts       # Job number requests + reference data
│   │   ├── useLeads.ts                  # Leads CRUD + search
│   │   ├── useLessonsLearned.ts         # Lessons learned CRUD
│   │   ├── useMarketingRecord.ts        # Marketing project records
│   │   ├── useMeetings.ts              # Meetings + calendar availability
│   │   ├── useMonthlyReview.ts          # Monthly review workflow
│   │   ├── useNotifications.ts          # Notification send + fetch
│   │   ├── usePermission.ts             # Single permission check (boolean)
│   │   ├── usePostBidAutopsy.ts         # Post-bid autopsy + finalization
│   │   ├── useProjectManagementPlan.ts  # PMP with approvals + signatures
│   │   ├── useProjectSchedule.ts        # Schedule + critical path items
│   │   ├── useQualityConcerns.ts        # Quality concerns CRUD
│   │   ├── useResponsibilityMatrix.ts   # Internal, owner-contract, sub-contract matrices
│   │   ├── useResponsive.ts             # Responsive breakpoint detection
│   │   ├── useRiskCostManagement.ts     # Risk/cost management CRUD
│   │   ├── useSafetyConcerns.ts         # Safety concerns CRUD
│   │   ├── useSelectedProject.ts        # Selected project from context
│   │   ├── useStartupChecklist.ts       # Startup checklist CRUD
│   │   ├── useSuperintendentPlan.ts     # Superintendent plan sections
│   │   ├── useTurnoverAgenda.ts       # Turnover meeting agenda CRUD + computed state + workflow
│   │   ├── useWorkflow.ts              # Composite workflow (team, deliverables, interview, contract, turnover, closeout, loss autopsy, stage transitions)
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
│   │   │   ├── PipelinePage.tsx
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
│   └── shared/                           # 25 reusable components (see §5)
│       ├── AutopsyMeetingScheduler.tsx
│       ├── AzureADPeoplePicker.tsx
│       ├── ConditionBuilder.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── ExportButtons.tsx
│       ├── KickoffMeetingScheduler.tsx
│       ├── KPICard.tsx
│       ├── LoadingSpinner.tsx
│       ├── MeetingScheduler.tsx
│       ├── PageHeader.tsx
│       ├── PipelineChart.tsx
│       ├── ProjectPicker.tsx
│       ├── ProvisioningStatus.tsx
│       ├── ScoreTierBadge.tsx
│       ├── SearchBar.tsx
│       ├── StageBadge.tsx
│       ├── StageIndicator.tsx
│       ├── StatusBadge.tsx
│       ├── SyncStatusIndicator.tsx
│       ├── WhatsNewModal.tsx
│       ├── WorkflowPreview.tsx
│       ├── WorkflowStepCard.tsx
│       └── index.ts
├── mock/                                  # 36 JSON mock data files (see §12)
├── models/                                # 40 TypeScript model files (see §6)
│   ├── enums.ts                          # All shared enums (29 enums)
│   ├── I*.ts                             # Interface files (one per entity)
│   └── index.ts                          # Barrel export
├── provisioning/
│   └── site-template.json                # SP site template definition
├── services/
│   ├── IDataService.ts                   # Service interface (171 methods)
│   ├── MockDataService.ts               # Mock implementation (all 171 implemented)
│   ├── SharePointDataService.ts         # SP implementation (49 implemented, 122 stubs)
│   ├── AuditService.ts                  # Fire-and-forget audit queue with 2s debounce
│   ├── CacheService.ts                  # Two-tier cache (memory + sessionStorage), 15min TTL
│   ├── columnMappings.ts                # SP column name mappings for all lists (1267 lines)
│   ├── ExportService.ts                 # PDF/Excel/CSV export with branded headers
│   ├── GraphService.ts                  # MS Graph: users, photos, calendar, mail, Teams
│   ├── HubNavigationService.ts          # Hub site nav link management (Mock + SP stub)
│   ├── NotificationService.ts           # Event-driven notification builder (20+ event types)
│   ├── OfflineQueueService.ts           # Offline write queue, auto-retry 30s, max 100 items
│   ├── PowerAutomateService.ts          # HTTP triggers: provisioning, notification, archive flows
│   ├── ProvisioningService.ts           # 7-step SP site provisioning with retry
│   └── index.ts
├── theme/
│   ├── globalStyles.ts                   # Global CSS injection
│   ├── hbcTheme.ts                      # Fluent UI v9 theme
│   └── tokens.ts                        # HBC_COLORS, BREAKPOINTS, SPACING
└── utils/
    ├── buyoutTemplate.ts                 # 20 standard buyout divisions (CSI MasterFormat)
    ├── constants.ts                      # HUB_LISTS, PROJECT_LISTS, ROUTES, STAGE_ORDER, STAGE_COLORS, etc.
    ├── estimatingKickoffTemplate.ts     # 3 sections, 58 template items
    ├── turnoverAgendaTemplate.ts        # Default prerequisites, discussion items, exhibits, signatures
    ├── formatters.ts                     # Currency, date, number, percentage, relative time formatters
    ├── permissions.ts                    # PERMISSIONS, ROLE_PERMISSIONS, NAV_GROUP_ROLES
    ├── riskEngine.ts                     # Commitment risk assessment ($50k bond, $250k escalation)
    ├── scoreCalculator.ts               # Go/No-Go score totals and tier calculation
    ├── siteDetector.ts                  # Hub vs project site detection from URL
    ├── stageEngine.ts                   # Stage transition state machine (11 stages)
    └── validators.ts                    # Lead form, project code (yy-nnn-0m), email validation
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
└── PERMISSION_STRATEGY.md    # Permission strategy documentation
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
| onInit() | Instantiates `MockDataService` (or `SharePointDataService` in production) |
| render() | Mounts `<App dataService={dataService} />` via ReactDOM to `this.domElement` |

### Standalone Dev Server

| Item | Value |
|------|-------|
| File | dev/index.tsx |
| Component | `DevRoot` wraps `<App>` with `<RoleSwitcher>` |
| Bootstrap | Creates `MockDataService`, mounts to `#root` via `ReactDOM.render` |
| Features | Role switching, hash reset on role change |

### App.tsx

| Item | Value |
|------|-------|
| File | src/webparts/hbcProjectControls/components/App.tsx |
| Component Tree | `FluentProvider` → `ErrorBoundary` → `AppProvider(dataService)` → `HashRouter` → `AppShell` → `AppRoutes` |
| Router Type | `HashRouter` from react-router-dom |
| Route Count | 48 routes (see §8) |

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

### Inline CSS Pattern
- All styling uses inline `style={{}}` objects with `HBC_COLORS` from `theme/tokens.ts`
- No CSS modules, no SCSS files, no CSS-in-JS libraries
- Consistent pattern: `color: HBC_COLORS.navy`, `backgroundColor: HBC_COLORS.gray50`, etc.

### Denormalized Field Pattern
- Fields copied from source (usually `Leads_Master`) are annotated with `/** @denormalized — source: Leads_Master.FieldName */`
- `syncDenormalizedFields(leadId)` propagates changes from lead to all dependent records
- Examples: `projectName` from `Leads_Master.Title`, `contractAmount` from `Leads_Master.ProjectValue`

---

## §5 Shared Components

| Component | File | Key Props | Used By (approx) |
|-----------|------|-----------|-------------------|
| AutopsyMeetingScheduler | components/shared/AutopsyMeetingScheduler.tsx | attendeeEmails, leadId?, projectCode?, onScheduled?, onCancel? | ~1 |
| AzureADPeoplePicker | components/shared/AzureADPeoplePicker.tsx | selectedUser, onSelect, label?, placeholder?, disabled? | ~2 |
| ConditionBuilder | components/shared/ConditionBuilder.tsx | assignment, onChange, onRemove, disabled? | ~1 |
| ConfirmDialog | components/shared/ConfirmDialog.tsx | open, title, message, confirmLabel?, cancelLabel?, onConfirm, onCancel, danger? | ~1 |
| DataTable | components/shared/DataTable.tsx | columns: IDataTableColumn<T>[], items, keyExtractor, isLoading?, onRowClick?, sortField?, onSort?, pageSize? | ~12 |
| EmptyState | components/shared/EmptyState.tsx | title, description?, icon?, action? | internal (DataTable) |
| ErrorBoundary | components/shared/ErrorBoundary.tsx | children, fallback? | 1 (App.tsx root) |
| ExportButtons | components/shared/ExportButtons.tsx | pdfElementId?, data?, filename, title? | ~10 |
| KickoffMeetingScheduler | components/shared/KickoffMeetingScheduler.tsx | attendeeEmails, leadId?, projectCode?, onScheduled?, onCancel? | ~1 |
| KPICard | components/shared/KPICard.tsx | title, value, subtitle?, icon?, trend?, onClick? | ~8 |
| LoadingSpinner | components/shared/LoadingSpinner.tsx | label?, size? ('tiny'\|'small'\|'medium'\|'large') | ~30+ |
| MeetingScheduler | components/shared/MeetingScheduler.tsx | meetingType, subject, attendeeEmails, leadId?, projectCode?, startDate, endDate, onScheduled, onCancel? | ~1 |
| PageHeader | components/shared/PageHeader.tsx | title, subtitle?, actions?, breadcrumb? | ~30+ |
| PipelineChart | components/shared/PipelineChart.tsx | leads, mode? ('count'\|'value'), height? | ~2 |
| ProjectPicker | components/shared/ProjectPicker.tsx | selected, onSelect | 1 (NavigationSidebar) |
| ProvisioningStatus | components/shared/ProvisioningStatus.tsx | projectCode, log?, pollInterval?, compact? | ~3 |
| ScoreTierBadge | components/shared/ScoreTierBadge.tsx | score, showLabel? | ~3 |
| SearchBar | components/shared/SearchBar.tsx | placeholder? | 1 (AppShell) |
| StageBadge | components/shared/StageBadge.tsx | stage, size? ('small'\|'medium') | ~4 |
| StageIndicator | components/shared/StageIndicator.tsx | currentStage, size? | ~1 |
| StatusBadge | components/shared/StatusBadge.tsx | label, color, backgroundColor, size? | ~5 |
| SyncStatusIndicator | components/shared/SyncStatusIndicator.tsx | (none) | 1 (AppShell) |
| WhatsNewModal | components/shared/WhatsNewModal.tsx | isOpen, onClose | 1 (AppShell) |
| WorkflowPreview | components/shared/WorkflowPreview.tsx | workflowKey, onClose | ~1 |
| WorkflowStepCard | components/shared/WorkflowStepCard.tsx | step, isExpanded, onToggle, onUpdateStep, onAddCondition, onUpdateCondition, onRemoveCondition, disabled? | ~1 |

---

## §6 Data Models

### Interfaces

| Interface | File | Key Fields | SP List Name | Site |
|-----------|------|------------|--------------|------|
| ILead | models/ILead.ts | id, Title, ClientName, Region, Sector, Division, Stage, ProjectCode?, ProjectValue?, GoNoGoDecision?, WinLossDecision? | Leads_Master | Hub |
| ILeadFormData | models/ILead.ts | extends Omit<ILead, 'id'\|'DateOfEvaluation'\|'Originator'\|'OriginatorId'> | Leads_Master | Hub |
| IGoNoGoScorecard | models/IGoNoGoScorecard.ts | id, LeadID, scores, TotalScore_Orig?, TotalScore_Cmte?, Decision?, DecisionDate? | GoNoGo_Scorecard | Hub |
| IScorecardCriterion | models/IGoNoGoScorecard.ts | id, label, high, avg, low | GoNoGo_Scorecard | Hub |
| IEstimatingTracker | models/IEstimatingTracker.ts | id, Title (@denormalized), LeadID, ProjectCode, Source?, DeliverableType?, DueDate_OutTheDoor?, LeadEstimator?, AwardStatus? | Estimating_Tracker | Hub |
| IEstimatingKickoff | models/IEstimatingKickoff.ts | id, LeadID, ProjectCode, Architect?, ProposalDueDateTime?, items: IEstimatingKickoffItem[] | Estimating_Kickoffs | Hub |
| IEstimatingKickoffItem | models/IEstimatingKickoff.ts | id, kickoffId?, section, task, status, responsibleParty?, sortOrder | Estimating_Kickoff_Items | Hub |
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
| IRole | models/IRole.ts | id, Title: RoleName, UserOrGroup, Permissions, IsActive | App_Roles | Hub |
| ICurrentUser | models/IRole.ts | id, displayName, email, loginName, roles: RoleName[], permissions: Set<string> | — | — |
| IFeatureFlag | models/IFeatureFlag.ts | id, FeatureName, Enabled, EnabledForRoles?, TargetDate?, Notes? | Feature_Flags | Hub |
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
| IWorkflowDefinition | models/IWorkflowDefinition.ts | id, workflowKey, name, description, steps, isActive, lastModifiedBy, lastModifiedDate | Workflow_Definitions | Hub |
| IWorkflowStep | models/IWorkflowDefinition.ts | id, workflowId, stepOrder, name, assignmentType, projectRole?, defaultAssignee?, conditionalAssignees, isConditional, actionLabel, canChairMeeting? | Workflow_Steps | Hub |
| IPersonAssignment | models/IWorkflowDefinition.ts | userId, displayName, email | — | — |
| IConditionalAssignment | models/IWorkflowDefinition.ts | id, stepId, conditions, assignee, priority | Workflow_Conditional_Assignments | Hub |
| IAssignmentCondition | models/IWorkflowDefinition.ts | field, operator, value | — | — |
| IWorkflowStepOverride | models/IWorkflowDefinition.ts | id, projectCode, workflowKey, stepId, overrideAssignee, overrideReason?, overriddenBy, overriddenDate | Workflow_Step_Overrides | Hub |
| IResolvedWorkflowStep | models/IWorkflowDefinition.ts | stepId, stepOrder, name, assignee, assignmentSource, isConditional, conditionMet, actionLabel, canChairMeeting | — | — |
| ITurnoverAgenda | models/ITurnoverAgenda.ts | id, projectCode, leadId, status: TurnoverStatus, header, estimateOverview, prerequisites, discussionItems, subcontractors, exhibits, signatures | Turnover_Agendas | Project |
| ITurnoverProjectHeader | models/ITurnoverAgenda.ts | projectName, clientName, projectValue, region, sector, division, deliveryMethod, projectCode, overrides | Turnover_Agendas | Project |
| ITurnoverEstimateOverview | models/ITurnoverAgenda.ts | id, turnoverAgendaId, estimatedCost, contractAmount, contingency, allowances, designBudget, overrides | Turnover_Estimate_Overviews | Project |
| ITurnoverPrerequisite | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, description, completed, completedBy?, completedDate? | Turnover_Prerequisites | Project |
| ITurnoverDiscussionItem | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, description, discussed, notes, attachments | Turnover_Discussion_Items | Project |
| ITurnoverSubcontractor | models/ITurnoverAgenda.ts | id, turnoverAgendaId, trade, companyName, contactName, contactPhone, contactEmail, qScore, isPreferred, isRequired | Turnover_Subcontractors | Project |
| ITurnoverExhibit | models/ITurnoverAgenda.ts | id, turnoverAgendaId, sortOrder, label, reviewed, fileUrl?, fileName?, linkedDocumentUrl?, isCustom | Turnover_Exhibits | Project |
| ITurnoverSignature | models/ITurnoverAgenda.ts | id, turnoverAgendaId, role, personName, personEmail, signed, signedDate?, comment?, affidavitText, sortOrder | Turnover_Signatures | Project |
| ITurnoverAttachment | models/ITurnoverAgenda.ts | id, discussionItemId, fileName, fileUrl, uploadedBy, uploadedDate, fileSize | Turnover_Attachments | Project |

### Enums (models/enums.ts)

| Enum | Values |
|------|--------|
| Stage | LeadDiscovery, GoNoGoPending, GoNoGoWait, Opportunity, Pursuit, WonContractPending, ActiveConstruction, Closeout, ArchivedNoGo, ArchivedLoss, ArchivedHistorical |
| Region | Miami, WestPalmBeach, MartinCounty, Orlando, Tallahassee |
| Sector | Airport, City, Commercial, County, Federal, GolfClubCourse, MixedUse, MultiFamily, Municipal, ParkingGarage, State, Warehouse |
| Division | Commercial, LuxuryResidential |
| DepartmentOfOrigin | BusinessDevelopment, Estimating, Marketing, Operations, Other |
| DeliveryMethod | GMP, HardBid, PreconWithGMP, Other |
| GoNoGoDecision | Go, NoGo, Wait |
| WinLossDecision | Win, Loss |
| LossReason | Price, Relationship, Experience, Schedule, Competition, Other |
| RoleName | BDRepresentative, EstimatingCoordinator, AccountingManager, PreconstructionTeam, OperationsTeam, ExecutiveLeadership, Legal, RiskManagement, Marketing, QualityControl, Safety, IDS |
| ProvisioningStatus | Queued, InProgress, Completed, PartialFailure, Failed |
| TurnoverStatus | Draft, PrerequisitesInProgress, MeetingScheduled, MeetingComplete, PendingSignatures, Signed, Complete |
| AuditAction | LeadCreated, LeadEdited, GoNoGoScoreSubmitted, GoNoGoDecisionMade, SiteProvisioningTriggered, SiteProvisioningCompleted, EstimateCreated, EstimateStatusChanged, TurnoverInitiated, TurnoverCompleted, PermissionChanged, MeetingScheduled, LossRecorded, AutopsyCompleted, ConfigFeatureFlagChanged, ConfigRoleChanged, ChecklistItemUpdated, ChecklistItemAdded, ChecklistSignedOff, MatrixAssignmentChanged, MatrixTaskAdded, ProjectRecordUpdated, ProjectRecordCreated, PMPSubmitted, PMPApproved, PMPReturned, PMPSigned, RiskItemUpdated, QualityConcernUpdated, SafetyConcernUpdated, ScheduleUpdated, SuperPlanUpdated, LessonAdded, MonthlyReviewSubmitted, MonthlyReviewAdvanced, WorkflowStepUpdated, WorkflowConditionAdded, WorkflowConditionRemoved, WorkflowOverrideSet, WorkflowOverrideRemoved, TurnoverAgendaCreated, TurnoverPrerequisiteCompleted, TurnoverItemDiscussed, TurnoverSubcontractorAdded, TurnoverSubcontractorRemoved, TurnoverExhibitReviewed, TurnoverExhibitAdded, TurnoverExhibitRemoved, TurnoverSigned, TurnoverAgendaCompleted, HubNavLinkCreated, HubNavLinkFailed, HubNavLinkRetried, HubNavLinkRemoved, HubSiteUrlUpdated |
| EntityType | Lead, Scorecard, Estimate, Project, Permission, Config, Checklist, Matrix, ProjectRecord, RiskCost, Quality, Safety, Schedule, SuperintendentPlan, LessonLearned, PMP, MonthlyReview, WorkflowDefinition, TurnoverAgenda |
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
| NotificationEvent | LeadSubmitted, GoNoGoScoringRequested, GoNoGoDecisionMade, SiteProvisioned, PreconKickoff, DeliverableDueApproaching, WinLossRecorded, AutopsyScheduled, TurnoverCompleted, SafetyFolderChanged, PMPSignatureRequested, PMPSubmittedForApproval, PMPApprovalRequired, PMPApproved, PMPReturnedForRevision, MonthlyReviewDueNotification, MonthlyReviewSubmittedToPX, MonthlyReviewReturnedToPM, MonthlyReviewSubmittedToLeadership, JobNumberRequested, JobNumberAssigned, EstimatingKickoffScheduled, AutopsyFinalized, CommitmentSubmitted, CommitmentWaiverRequired, CommitmentApproved, CommitmentEscalatedToCFO, CommitmentRejected |
| WorkflowKey | GO_NO_GO, PMP_APPROVAL, MONTHLY_REVIEW, COMMITMENT_APPROVAL, TURNOVER_APPROVAL |
| StepAssignmentType | ProjectRole, NamedPerson |
| ConditionField | Division, Region, Sector |

### Type Aliases

| Alias | File | Definition |
|-------|------|------------|
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

---

## §7 Service Methods

171 methods on IDataService. Source: `services/IDataService.ts`

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
| 21 | getCurrentUser | () → Promise<ICurrentUser> | Impl | Stub | AppContext | users.json |
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
| 34 | triggerProvisioning | (leadId: number, projectCode: string, projectName: string, requestedBy: string) → Promise<IProvisioningLog> | Impl | Stub | GoNoGoScorecard | in-memory |
| 35 | getProvisioningStatus | (projectCode: string) → Promise<IProvisioningLog \| null> | Impl | Impl | ProvisioningStatus | in-memory |
| 36 | updateProvisioningLog | (projectCode: string, data: Partial<IProvisioningLog>) → Promise<IProvisioningLog> | Impl | Stub | — | in-memory |
| 37 | getProvisioningLogs | () → Promise<IProvisioningLog[]> | Impl | Impl | AdminPanel | in-memory |
| 38 | retryProvisioning | (projectCode: string, fromStep: number) → Promise<IProvisioningLog> | Impl | Stub | AdminPanel | in-memory |
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
| 56 | getStartupChecklist | (projectCode: string) → Promise<IStartupChecklistItem[]> | Impl | Stub | useStartupChecklist | startupChecklist.json |
| 57 | updateChecklistItem | (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) → Promise<IStartupChecklistItem> | Impl | Stub | useStartupChecklist | startupChecklist.json |
| 58 | addChecklistItem | (projectCode: string, item: Partial<IStartupChecklistItem>) → Promise<IStartupChecklistItem> | Impl | Stub | useStartupChecklist | startupChecklist.json |
| 59 | removeChecklistItem | (projectCode: string, itemId: number) → Promise<void> | Impl | Stub | useStartupChecklist | startupChecklist.json |
| 60 | getInternalMatrix | (projectCode: string) → Promise<IInternalMatrixTask[]> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 61 | updateInternalMatrixTask | (projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>) → Promise<IInternalMatrixTask> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 62 | addInternalMatrixTask | (projectCode: string, task: Partial<IInternalMatrixTask>) → Promise<IInternalMatrixTask> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 63 | removeInternalMatrixTask | (projectCode: string, taskId: number) → Promise<void> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 64 | getTeamRoleAssignments | (projectCode: string) → Promise<ITeamRoleAssignment[]> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 65 | updateTeamRoleAssignment | (projectCode: string, role: string, person: string, email?: string) → Promise<ITeamRoleAssignment> | Impl | Stub | useResponsibilityMatrix | internalMatrix.json |
| 66 | getOwnerContractMatrix | (projectCode: string) → Promise<IOwnerContractArticle[]> | Impl | Stub | useResponsibilityMatrix | ownerContractMatrix.json |
| 67 | updateOwnerContractArticle | (projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>) → Promise<IOwnerContractArticle> | Impl | Stub | useResponsibilityMatrix | ownerContractMatrix.json |
| 68 | addOwnerContractArticle | (projectCode: string, item: Partial<IOwnerContractArticle>) → Promise<IOwnerContractArticle> | Impl | Stub | useResponsibilityMatrix | ownerContractMatrix.json |
| 69 | removeOwnerContractArticle | (projectCode: string, itemId: number) → Promise<void> | Impl | Stub | useResponsibilityMatrix | ownerContractMatrix.json |
| 70 | getSubContractMatrix | (projectCode: string) → Promise<ISubContractClause[]> | Impl | Stub | useResponsibilityMatrix | subContractMatrix.json |
| 71 | updateSubContractClause | (projectCode: string, itemId: number, data: Partial<ISubContractClause>) → Promise<ISubContractClause> | Impl | Stub | useResponsibilityMatrix | subContractMatrix.json |
| 72 | addSubContractClause | (projectCode: string, item: Partial<ISubContractClause>) → Promise<ISubContractClause> | Impl | Stub | useResponsibilityMatrix | subContractMatrix.json |
| 73 | removeSubContractClause | (projectCode: string, itemId: number) → Promise<void> | Impl | Stub | useResponsibilityMatrix | subContractMatrix.json |
| 74 | getMarketingProjectRecord | (projectCode: string) → Promise<IMarketingProjectRecord \| null> | Impl | Stub | useMarketingRecord | marketingProjectRecords.json |
| 75 | createMarketingProjectRecord | (data: Partial<IMarketingProjectRecord>) → Promise<IMarketingProjectRecord> | Impl | Stub | useMarketingRecord | marketingProjectRecords.json |
| 76 | updateMarketingProjectRecord | (projectCode: string, data: Partial<IMarketingProjectRecord>) → Promise<IMarketingProjectRecord> | Impl | Stub | useMarketingRecord | marketingProjectRecords.json |
| 77 | getAllMarketingProjectRecords | () → Promise<IMarketingProjectRecord[]> | Impl | Stub | useMarketingRecord | marketingProjectRecords.json |
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
| 115 | getJobNumberRequests | (status?: JobNumberRequestStatus) → Promise<IJobNumberRequest[]> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 116 | getJobNumberRequestByLeadId | (leadId: number) → Promise<IJobNumberRequest \| null> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 117 | createJobNumberRequest | (data: Partial<IJobNumberRequest>) → Promise<IJobNumberRequest> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 118 | finalizeJobNumber | (requestId: number, jobNumber: string, assignedBy: string) → Promise<IJobNumberRequest> | Impl | Stub | useJobNumberRequest | jobNumberRequests.json |
| 119 | getProjectTypes | () → Promise<IProjectType[]> | Impl | Stub | useJobNumberRequest | projectTypes.json |
| 120 | getStandardCostCodes | () → Promise<IStandardCostCode[]> | Impl | Stub | useJobNumberRequest | standardCostCodes.json |
| 121 | rekeyProjectCode | (oldCode: string, newCode: string, leadId: number) → Promise<void> | Impl | Stub | — | in-memory |
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
| 141 | syncDenormalizedFields | (leadId: number) → Promise<void> | Impl | Stub | — | in-memory |
| 142 | promoteToHub | (projectCode: string) → Promise<void> | Impl | Stub | — | in-memory |
| 143 | getWorkflowDefinitions | () → Promise<IWorkflowDefinition[]> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 144 | getWorkflowDefinition | (workflowKey: WorkflowKey) → Promise<IWorkflowDefinition \| null> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 145 | updateWorkflowStep | (workflowId: number, stepId: number, data: Partial<IWorkflowStep>) → Promise<IWorkflowStep> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 146 | addConditionalAssignment | (stepId: number, assignment: Partial<IConditionalAssignment>) → Promise<IConditionalAssignment> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 147 | updateConditionalAssignment | (assignmentId: number, data: Partial<IConditionalAssignment>) → Promise<IConditionalAssignment> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 148 | removeConditionalAssignment | (assignmentId: number) → Promise<void> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
| 149 | getWorkflowOverrides | (projectCode: string) → Promise<IWorkflowStepOverride[]> | Impl | Stub | useWorkflowDefinitions | workflowStepOverrides.json |
| 150 | setWorkflowStepOverride | (override: Partial<IWorkflowStepOverride>) → Promise<IWorkflowStepOverride> | Impl | Stub | useWorkflowDefinitions | workflowStepOverrides.json |
| 151 | removeWorkflowStepOverride | (overrideId: number) → Promise<void> | Impl | Stub | useWorkflowDefinitions | workflowStepOverrides.json |
| 152 | resolveWorkflowChain | (workflowKey: WorkflowKey, projectCode: string) → Promise<IResolvedWorkflowStep[]> | Impl | Stub | useWorkflowDefinitions | workflowDefinitions.json |
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
| 171 | setHubSiteUrl | (url: string) → Promise<void> | Impl | Stub | AdminPanel | in-memory |

---

## §8 Routes

Source: `components/App.tsx`

| Route Path | Component | File | Requires Project | Permission Guard |
|------------|-----------|------|-----------------|-----------------|
| / | DashboardPage | pages/hub/DashboardPage.tsx | No | — |
| /marketing | MarketingDashboard | pages/hub/MarketingDashboard.tsx | No | MARKETING_DASHBOARD_VIEW |
| /preconstruction | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — |
| /preconstruction/gonogo | GoNoGoTracker | pages/precon/GoNoGoTracker.tsx | No | — |
| /preconstruction/pipeline | PipelinePage | pages/hub/PipelinePage.tsx | No | — |
| /preconstruction/precon-tracker | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — |
| /preconstruction/estimate-log | EstimatingDashboard | pages/precon/EstimatingDashboard.tsx | No | — |
| /preconstruction/kickoff-list | EstimatingKickoffList | pages/precon/EstimatingKickoffList.tsx | No | KICKOFF_VIEW |
| /preconstruction/autopsy-list | PostBidAutopsyList | pages/precon/PostBidAutopsyList.tsx | No | AUTOPSY_VIEW |
| /preconstruction/pursuit/:id | PursuitDetail | pages/precon/PursuitDetail.tsx | No | — |
| /preconstruction/pursuit/:id/kickoff | EstimatingKickoffPage | pages/precon/EstimatingKickoffPage.tsx | No | KICKOFF_VIEW |
| /preconstruction/pursuit/:id/interview | InterviewPrep | pages/project/InterviewPrep.tsx | No | — |
| /preconstruction/pursuit/:id/winloss | WinLossRecorder | pages/project/WinLossRecorder.tsx | No | — |
| /preconstruction/pursuit/:id/turnover | TurnoverToOps | pages/project/TurnoverToOps.tsx | No | — |
| /preconstruction/pursuit/:id/autopsy | LossAutopsy | pages/project/LossAutopsy.tsx | No | — |
| /preconstruction/pursuit/:id/autopsy-form | PostBidAutopsyForm | pages/precon/PostBidAutopsyForm.tsx | No | AUTOPSY_VIEW |
| /preconstruction/pursuit/:id/deliverables | DeliverablesTracker | pages/project/DeliverablesTracker.tsx | No | — |
| /lead/new | LeadFormPage | pages/hub/LeadFormPage.tsx | No | — |
| /lead/:id | LeadDetailPage | pages/hub/LeadDetailPage.tsx | No | — |
| /lead/:id/gonogo | GoNoGoScorecard | pages/hub/GoNoGoScorecard.tsx | No | — |
| /lead/:id/gonogo/detail | GoNoGoDetail | pages/hub/GoNoGoDetail.tsx | No | — |
| /lead/:id/schedule-gonogo | GoNoGoMeetingScheduler | pages/hub/GoNoGoMeetingScheduler.tsx | No | — |
| /operations | ActiveProjectsDashboard | pages/hub/ActiveProjectsDashboard.tsx | No | ACTIVE_PROJECTS_VIEW |
| /operations/project | ProjectDashboard | pages/project/ProjectDashboard.tsx | Yes | — |
| /operations/startup-checklist | ProjectStartupChecklist | pages/project/ProjectStartupChecklist.tsx | Yes | — |
| /operations/management-plan | ProjectManagementPlan | pages/project/pmp/ProjectManagementPlan.tsx | Yes | PMP_EDIT |
| /operations/superintendent-plan | SuperintendentPlanPage | pages/project/SuperintendentPlanPage.tsx | Yes | — |
| /operations/responsibility | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — |
| /operations/responsibility/owner-contract | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — |
| /operations/responsibility/sub-contract | ResponsibilityMatrices | pages/project/ResponsibilityMatrices.tsx | Yes | — |
| /operations/closeout-checklist | CloseoutChecklist | pages/project/CloseoutChecklist.tsx | Yes | — |
| /operations/buyout-log | BuyoutLogPage | pages/project/BuyoutLogPage.tsx | Yes | BUYOUT_VIEW |
| /operations/contract-tracking | ContractTracking | pages/project/ContractTracking.tsx | Yes | — |
| /operations/compliance-log | ComplianceLog | pages/hub/ComplianceLog.tsx | No | COMPLIANCE_LOG_VIEW |
| /operations/risk-cost | RiskCostManagement | pages/project/RiskCostManagement.tsx | Yes | RISK_EDIT |
| /operations/schedule | ProjectScheduleCriticalPath | pages/project/ProjectScheduleCriticalPath.tsx | Yes | — |
| /operations/quality-concerns | QualityConcernsTracker | pages/project/QualityConcernsTracker.tsx | Yes | — |
| /operations/safety-concerns | SafetyConcernsTracker | pages/project/SafetyConcernsTracker.tsx | Yes | — |
| /operations/monthly-review | MonthlyProjectReview | pages/project/MonthlyProjectReview.tsx | Yes | — |
| /operations/project-record | ProjectRecord | pages/project/ProjectRecord.tsx | Yes | — |
| /operations/lessons-learned | LessonsLearnedPage | pages/project/LessonsLearnedPage.tsx | Yes | — |
| /operations/gonogo | GoNoGoScorecard | pages/hub/GoNoGoScorecard.tsx | Yes | — |
| /job-request | JobNumberRequestForm | pages/hub/JobNumberRequestForm.tsx | No | — |
| /job-request/:leadId | JobNumberRequestForm | pages/hub/JobNumberRequestForm.tsx | No | — |
| /accounting-queue | AccountingQueuePage | pages/hub/AccountingQueuePage.tsx | No | ACCOUNTING_QUEUE_VIEW |
| /admin | AdminPanel | pages/hub/AdminPanel.tsx | No | ADMIN_CONFIG |
| /access-denied | AccessDeniedPage | pages/shared/AccessDeniedPage.tsx | No | — |
| * | NotFoundPage | (inline in App.tsx) | No | — |

---

## §9 Navigation Sidebar

Source: `components/layouts/NavigationSidebar.tsx`

```
Dashboard                                    [always visible, path: /]
─────────────────────────────────────────────
Marketing                                    [roles: Marketing, Executive Leadership]
  ├── Marketing Dashboard                    [/marketing, permission: marketing:dashboard:view]
  └── Project Record                         [/operations/project-record, requiresProject]
─────────────────────────────────────────────
Preconstruction                              [roles: BD Rep, Estimating Coord, Precon Team, Exec Leadership, Legal]
  ├── Estimating Dashboard                   [/preconstruction]
  ├── Pipeline                               [/preconstruction/pipeline]
  ├── Go/No-Go Tracker                       [/preconstruction/gonogo]
  ├── Precon Tracker                          [/preconstruction/precon-tracker]
  ├── Estimate Log                            [/preconstruction/estimate-log]
  ├── Kick-Off Checklists                     [/preconstruction/kickoff-list, permission: kickoff:view]
  ├── Post-Bid Autopsies                      [/preconstruction/autopsy-list, permission: autopsy:view]
  ├── New Lead                                [/lead/new, permission: lead:create]
  ├── Job Number Request                      [/job-request, permission: job_number_request:create]
  └── Accounting Queue                        [/accounting-queue, permission: accounting_queue:view]
─────────────────────────────────────────────
Operations                                   [roles: Ops Team, Exec Leadership, Risk Mgmt, QC, Safety, IDS]
  ├── Active Projects                         [/operations, permission: active_projects:view]
  ├── Compliance Log                          [/operations/compliance-log, permission: compliance_log:view]
  ├── [Project Manual]
  │   ├── Project Dashboard                   [/operations/project, requiresProject]
  │   ├── Startup Checklist                   [/operations/startup-checklist, requiresProject]
  │   ├── Management Plan                     [/operations/management-plan, requiresProject]
  │   ├── Super's Plan                        [/operations/superintendent-plan, requiresProject]
  │   └── Responsibility                      [/operations/responsibility, requiresProject]
  ├── [Commitments]
  │   ├── Buyout Log                          [/operations/buyout-log, requiresProject, permission: buyout:view]
  │   ├── Contract Tracking                   [/operations/contract-tracking, requiresProject]
  │   └── Closeout Checklist                  [/operations/closeout-checklist, requiresProject]
  └── [Project Controls]
      ├── Risk & Cost                         [/operations/risk-cost, requiresProject]
      ├── Schedule                            [/operations/schedule, requiresProject]
      ├── Quality Concerns                    [/operations/quality-concerns, requiresProject]
      ├── Safety Concerns                     [/operations/safety-concerns, requiresProject]
      ├── Monthly Review                      [/operations/monthly-review, requiresProject]
      └── Lessons Learned                     [/operations/lessons-learned, requiresProject]
─────────────────────────────────────────────
Admin                                        [roles: Executive Leadership]
  └── Admin Panel                             [/admin, permission: admin:config]
```

Items with `requiresProject` are disabled (grayed out) when no project is selected. Items with `permission` are hidden if user lacks that permission.

---

## §10 RBAC Matrix

Source: `utils/permissions.ts`

Legend: **X** = has permission

| Permission | BD Rep | Est Coord | Acct Mgr | Precon | Ops | Exec | Legal | Risk Mgmt | Marketing | QC | Safety | IDS |
|-----------|--------|-----------|----------|--------|-----|------|-------|-----------|-----------|-----|--------|-----|
| lead:create | X | | | | | | | | | | | |
| lead:read | X | X | X | | | X | X | X | X | | | |
| lead:edit | X | | | | | | | | | | | |
| lead:delete | X | | | | | | | | | | | |
| gonogo:score:originator | X | X | | | | | | | | | | |
| gonogo:score:committee | | | | | | X | | | | | | |
| gonogo:submit | X | | | | | | | | | | | |
| gonogo:decide | | | | | | X | | | | | | |
| gonogo:read | X | X | X | | | X | X | X | X | | | |
| precon:read | X | X | X | X | | X | X | X | X | X | X | X |
| precon:edit | | X | | X | | | | | | | | |
| proposal:read | X | X | X | X | | X | X | X | X | X | X | X |
| proposal:edit | | X | | X | | | | | X | | | |
| winloss:record | X | | | | | | | | | | | |
| winloss:read | X | X | X | X | | X | X | X | X | X | X | X |
| contract:read | X | X | X | X | | X | X | X | X | X | X | X |
| contract:edit | | | | | | | X | | | | | |
| contract:view:financials | | | X | | | X | | | | | | |
| turnover:read | X | X | X | X | X | X | X | X | X | X | X | X |
| turnover:edit | | | | | X | | | | | | | |
| closeout:read | X | X | X | X | X | X | X | X | X | X | X | X |
| closeout:edit | | | | | X | | | | | | | |
| estimating:read | X | X | X | X | | X | | | | | | |
| estimating:edit | | X | | | | | | | | | | |
| precon:hub:view | | X | | | | X | | | | | | |
| project:hub:view | | X | | | X | X | | | | | | |
| admin:roles | | | | | | X | | | | | | |
| admin:flags | | | | | | X | | | | | | |
| admin:config | | | | | | X | | | | | | X |
| admin:connections | | | | | | X | | | | | | |
| admin:provisioning | | | | | | X | | | | | | |
| marketing:edit | | | | | | | | | X | | | |
| marketing:dashboard:view | | | | | | X | | | X | | | |
| site:provision | X | | | | | | | | | | | |
| meeting:schedule | X | | | | | X | | | | | | |
| meeting:read | X | X | X | X | X | X | X | X | X | X | X | X |
| startup:checklist:edit | | | | | X | | | | | | | |
| startup:checklist:signoff | | | | | | X | | | | | | |
| matrix:edit | | | | | X | | | | | | | |
| projectrecord:edit | | | | | | | | | X | | | |
| projectrecord:ops:edit | | | | | X | | | | | | | |
| pmp:edit | | | | | X | | | | | | | |
| pmp:approve | | | | | | X | | | | | | |
| pmp:final:approve | | | | | | X | | | | | | |
| pmp:sign | | | | | X | X | | | | | | |
| risk:edit | | | | | X | | | X | | | | |
| quality:edit | | | | | X | | | | | X | | |
| safety:edit | | | | | X | | | | | | | |
| schedule:edit | | | | | X | | | | | | | |
| superintendent:plan:edit | | | | | X | | | | | | | |
| lessons:edit | | | | | X | | | | | | | |
| monthly:review:pm | | | | | X | | | | | | | |
| monthly:review:px | | | | | | X | | | | | | |
| monthly:review:create | | | | | | X | | | | | | |
| job_number_request:create | | X | | | | | | | | | | |
| job_number_request:finalize | | | X | | | | | | | | | |
| accounting_queue:view | | | X | | | | | | | | | |
| kickoff:view | X | X | | X | | X | | | | | | |
| kickoff:edit | | X | | | | X | | | | | | |
| kickoff:template:edit | | X | | | | X | | | | | | |
| autopsy:view | X | X | | X | | X | | | | | | |
| autopsy:edit | | X | | | | X | | | | | | |
| autopsy:schedule | | X | | | | X | | | | | | |
| buyout:view | | | | X | X | X | | | | | | |
| buyout:edit | | | | | X | X | | | | | | |
| buyout:manage | | | | | X | | | | | | | |
| commitment:submit | | | | | X | | | | | | | |
| commitment:approve:px | | | | | | X | | | | | | |
| commitment:approve:compliance | | | | | | | | X | | | | |
| commitment:approve:cfo | | | | | | X | | | | | | |
| commitment:escalate | | | | | | X | | X | | | | |
| active_projects:view | | | | | X | X | | | | | | |
| active_projects:sync | | | | | | X | | | | | | |
| compliance_log:view | | | | | X | X | | X | | | | |
| workflow:manage | | | | | | X | | | | | | |
| turnover:agenda:edit | | X | | X | X | X | | | | | | |
| turnover:sign | | X | | | X | X | | | | | | |

### NAV_GROUP_ROLES

| Nav Group | Roles That Can See |
|-----------|-------------------|
| Marketing | Marketing, Executive Leadership |
| Preconstruction | BD Representative, Estimating Coordinator, Preconstruction Team, Executive Leadership, Legal |
| Operations | Operations Team, Executive Leadership, Risk Management, Quality Control, Safety, IDS |
| Admin | Executive Leadership |

---

## §11 Feature Flags

Source: `mock/featureFlags.json`

| Flag Name | ID | Default | What It Gates |
|-----------|-----|---------|---------------|
| LeadIntake | 1 | true | Core lead intake feature |
| GoNoGoScorecard | 2 | true | Go/No-Go scoring interface |
| AutoSiteProvisioning | 3 | true | Automatic SP site provisioning |
| MeetingScheduler | 4 | true | Calendar meeting scheduler |
| PipelineDashboard | 5 | true | Pipeline visualization |
| TurnoverWorkflow | 6 | true | Turnover to ops workflow |
| LossAutopsy | 7 | true | Loss autopsy module |
| EstimatingTracker | 8 | true | Estimating tracker |
| UnanetIntegration | 9 | false | Unanet ERP integration (target: 2026-06-01) |
| SageIntegration | 10 | false | Sage 300 accounting (target: 2026-06-01) |
| DocumentCrunchIntegration | 11 | false | AI contract review (target: 2026-09-01) |
| EstimatingModule | 12 | false | Full estimating module (target: 2026-12-01) |
| BudgetSync | 13 | false | Budget sync with accounting |
| ExecutiveDashboard | 14 | true | Executive dashboard |
| DualNotifications | 15 | false | Send both email and Teams notifications |
| AuditTrail | 16 | false | Detailed audit trail logging |
| OfflineSupport | 17 | false | Offline mode with queue sync |
| ProjectStartup | 18 | true | Startup checklist and responsibility matrices |
| MarketingProjectRecord | 19 | true | Marketing project record and dashboard |
| ProjectManagementPlan | 20 | true | PMP and operational modules |
| MonthlyProjectReview | 21 | true | Monthly project review |
| WorkflowDefinitions | 22 | true | Workflow definition configuration |

---

## §12 Mock Data Files

Source: `mock/`

| JSON File | Entity Type | Record Count | Project Codes |
|-----------|-------------|-------------|---------------|
| appContextConfig.json | App context configs | 3 | N/A |
| buyoutEntries.json | IBuyoutEntry | 15 | 25-042-01 |
| calendarAvailability.json | ICalendarAvailability | 7 | N/A |
| closeoutItems.json | ICloseoutItem | 15 | 25-042-01 |
| deliverables.json | IDeliverable | 10 | 25-042-01 |
| divisionApprovers.json | IDivisionApprover | 2 | N/A |
| estimating.json | IEstimatingTracker | 23 | 25-038-01, 25-035-01, 25-041-01, 25-039-01, 25-033-01, 26-004-01, 26-005-01, 25-030-01, 25-028-01, 25-012-01, 24-052-01, 24-042-01, 24-078-01, 24-008-01, 25-022-01, 25-025-01, 25-019-01, 25-015-01, 25-020-01, 25-027-01, 26-001-01, 25-018-01, 25-010-01 |
| estimatingKickoffs.json | IEstimatingKickoff | 1 | 25-042-01 |
| featureFlags.json | IFeatureFlag | 21 | N/A |
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
| scorecards.json | IGoNoGoScorecard | 10 | 25-038-01, 25-035-01 |
| standardCostCodes.json | IStandardCostCode | 24 | N/A |
| startupChecklist.json | IStartupChecklistItem | 55 | 25-042-01 |
| subContractMatrix.json | ISubContractClause | 20 | 25-042-01 |
| superintendentPlan.json | ISuperintendentPlan | 2 | 25-042-01, 25-115-01 |
| teamMembers.json | ITeamMember | 10 | 25-042-01 |
| templateRegistry.json | Template definitions | 12 | N/A |
| turnoverAgendas.json | ITurnoverAgenda (flat) | 2 agendas + child arrays | 25-042-01, 25-115-01 |
| turnoverItems.json | ITurnoverItem | 14 | 25-042-01 |
| users.json | IRole + ICurrentUser | 24 | N/A |
| workflowDefinitions.json | IWorkflowDefinition | 5 | N/A |
| workflowStepOverrides.json | IWorkflowStepOverride | 0 | N/A |

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

1. **Model** — Create `models/INewEntity.ts` with interface, add to `models/index.ts` barrel
2. **Mock JSON** — Create `mock/newEntities.json` with sample data
3. **Service Methods** — Add methods to `services/IDataService.ts` interface
4. **MockDataService** — Implement methods in `services/MockDataService.ts` reading from mock JSON
5. **SharePointDataService** — Add stubs in `services/SharePointDataService.ts`
6. **Column Mappings** — Add to `services/columnMappings.ts` if new SP list
7. **Hook** — Create `components/hooks/useNewEntity.ts`, add to `hooks/index.ts` barrel
8. **Component** — Create page component in appropriate `pages/` subdirectory, add to its `index.ts`
9. **Route** — Add route in `components/App.tsx`
10. **Navigation** — Add nav item in `components/layouts/NavigationSidebar.tsx`
11. **Constants** — Add list name to `HUB_LISTS` or `PROJECT_LISTS` in `utils/constants.ts` if new SP list
12. **Permissions** — Add permission keys to `utils/permissions.ts` if new access control needed
13. **Update CLAUDE.md** — Update all affected sections

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

### Known Stubs / Placeholders

- **SharePointDataService**: 122 of 171 methods are stubs (return empty/null/throw). All Phase 7+ project-level list operations are stubbed.
- **HubNavigationService**: SharePointHubNavigationService is a stub (all 3 methods throw).
- **Column Mappings**: `columnMappings.ts` has mappings for all lists but SP service stubs don't use them yet.
- **Offline Support**: `OfflineQueueService.ts` exists but feature flag `OfflineSupport` is disabled.
- **Dual Notifications**: `DualNotifications` feature flag exists but is disabled.
- **Audit Trail UI**: `AuditTrail` feature flag exists but detailed UI not built.
- **ERP Integrations**: `UnanetIntegration`, `SageIntegration`, `DocumentCrunchIntegration`, `EstimatingModule`, `BudgetSync` — all flagged off, no implementation.
- **Navigation Sidebar Phase 12 Design Gap**: The Phase 12 design calls for Closeout Checklist under "Project Manual" (currently under "Commitments") and a new "Project Record" sub-group containing Project Record, Lessons Learned, and Go/No-Go (read-only). The actual `NavigationSidebar.tsx` has not been updated to reflect this design yet.

### SharePointDataService Status

- **Implemented (49)**: Leads CRUD, Go/No-Go CRUD, Estimating CRUD, Roles/Flags CRUD, Audit log/read, Provisioning read, Phase 6 workflow (team, deliverables, interview, contract, turnover, closeout, loss autopsy), Buyout/Commitment/Compliance, Active Projects Portfolio, AppContextConfig, hub site URL read
- **Stubbed (122)**: All startup checklist, all matrices, all marketing records, all risk/cost/quality/safety/schedule, all superintendent plan, all lessons learned, all PMP, all monthly review, all estimating kickoff, all job number requests, all workflow definitions, all turnover agenda, reference data, re-key, sync, promote, getCurrentUser, meetings, notifications, provisioning triggers, hub site URL write

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

9. **Inline styles only** — No CSS modules or SCSS. All styling uses `style={{}}` with `HBC_COLORS` from tokens.ts. Do not introduce CSS files.

10. **Fire-and-forget audit calls** — `logAudit()` calls should not be awaited in the UI flow. They are non-blocking. Wrapping them in `try/catch` with no re-throw is the pattern.

11. **PMP approval cycle numbering** — `currentCycleNumber` on `IProjectManagementPlan` must be incremented when creating new approval cycles. The `submitPMPForApproval` method handles this automatically.

12. **Flattened child collections in MockDataService** — Mock JSON files store parent and child entities in flat arrays. The `MockDataService` assembles them (e.g., kickoff + kickoffItems, riskCost + riskCostItems). New entities with children must follow this pattern.

---

## Audit Log

| Date | Sections Changed | What Changed |
|------|-----------------|--------------|
| 2026-02-09 | §3, §15 | §3: Fixed route count from 47 to 48 (App.tsx has 48 Route elements). §15: Merged monthly review into Phase 10 summary (it was built alongside other operational modules, not as a separate phase). Relabeled Phase 11 from "Monthly project review" to "Data Strategy Refactor" (flattened mock data, columnMappings.ts, DATA_ARCHITECTURE.md, PERMISSION_STRATEGY.md). Added known gap: NavigationSidebar.tsx does not yet reflect Phase 12 design (Closeout under Project Manual, Project Record sub-group). All other sections (§1-§2, §4-§14, §16) validated against source files with no discrepancies found. |
| 2026-02-09 | §2, §3, §5, §6, §7, §10, §11, §12, §13, §15 | Phase 13: Added workflow definition configuration. 4 new workflows (Go/No-Go, PMP, Monthly Review, Commitment) with 14 steps. AdminPanel expanded to 6 tabs. 10 new IDataService methods (152 total). 3 new enums, 6 new enum values. 4 new shared components, 1 new hook, 1 new page. |
| 2026-02-09 | §2, §6, §7, §10, §12, §13, §15 | Phase 15: Turnover to Ops Meeting Agenda. TurnoverToOps.tsx rewritten as two-tab module (Meeting Agenda + Follow-Up Checklist). 9 new interfaces (ITurnoverAgenda + 8 sub-interfaces). 17 new IDataService methods (169 total). 1 new enum (TurnoverStatus), 10 AuditAction values, 1 EntityType, 1 WorkflowKey. 2 new permissions (turnover:agenda:edit, turnover:sign). 7 new PROJECT_LISTS. 7 new column mappings. 5th workflow (TURNOVER_APPROVAL). New files: ITurnoverAgenda.ts, turnoverAgendaTemplate.ts, turnoverAgendas.json, useTurnoverAgenda.ts. |
| 2026-02-09 | §2, §6, §7, §13, §15 | Phase 16: Hub Site Navigation Link Provisioning. Added HubNavigationService.ts to services. IProvisioningLog updated with hubNavLinkStatus field. 1 new type alias (HubNavLinkStatus). 5 new AuditAction enum values (HubNavLinkCreated, HubNavLinkFailed, HubNavLinkRetried, HubNavLinkRemoved, HubSiteUrlUpdated). 2 new IDataService methods (171 total): getHubSiteUrl (implemented), setHubSiteUrl (stub). Added DEFAULT_HUB_SITE_URL constant. SharePointDataService: 49 implemented, 122 stubs. HubNavigationService SP stub added to known stubs. |
