# Data Architecture — HBC Project Controls

Phase 5D Cross-cutting Governance Document. Last updated: 2026-02-24.

---

## 1. Data Layer Overview

The HBC Project Controls data layer is built on the `IDataService` interface with 276 methods spanning leads, scorecards, estimates, projects, provisioning, connectors, scheduling, and more.

Three implementations exist:

| Implementation | Mode | Usage |
|---------------|------|-------|
| `MockDataService` | mock (default) | Development, testing, Storybook, Playwright |
| `SharePointDataService` | sharepoint | Production SPFx web part |
| `StandaloneSharePointDataService` | standalone | MSAL 5.x browser OAuth dev mode |

`DataProviderFactory` in `packages/hbc-sp-services/src/factory/` reads `VITE_DATA_SERVICE_BACKEND` env var to select the active implementation at runtime.

## 2. SharePoint List Taxonomy

Two categories of SharePoint lists, distinguished by site scope:

**HUB_LISTS (43 lists)** on the central hub site (`HBCentral`):
- Core: `Leads_Master`, `App_Roles`, `Feature_Flags`, `App_Context_Config`
- Preconstruction: `Estimating_Tracker`, `GoNoGo_Scorecard`, `GNG_Committee`, `Estimating_Kickoffs`, `Estimating_Kickoff_Items`, `Loss_Autopsies`, `Autopsy_Attendees`
- Portfolio: `Active_Projects_Portfolio`, `Marketing_Project_Records`, `Project_Data_Mart`
- Workflows: `Workflow_Definitions`, `Workflow_Steps`, `Workflow_Conditional_Assignments`, `Workflow_Step_Overrides`
- Security: `Permission_Templates`, `Security_Group_Mappings`, `Project_Team_Assignments`, `Assignment_Mappings`
- Infrastructure: `Audit_Log`, `Audit_Log_Archive`, `Performance_Logs`, `Provisioning_Log`, `Template_Registry`, `Template_Site_Config`, `Template_Manifest_Log`
- Reference: `Regions`, `Sectors`, `Sector_Definitions`, `Project_Types`, `Standard_Cost_Codes`, `Job_Number_Requests`, `Division_Approvers`, `Help_Guides`, `PMP_Boilerplate`

**PROJECT_LISTS (48 lists)** provisioned per project site:
- Core: `Project_Info`, `Team_Members`, `Deliverables`, `Action_Items`, `Contract_Info`
- Startup/Closeout: `Startup_Checklist`, `Checklist_Activity_Log`, `Turnover_Checklist`, `Closeout_Items` + 8 turnover sub-lists
- Financial: `Buyout_Log`, `Commitment_Approvals`, `Contract_Tracking_Approvals`
- Responsibility: `Internal_Matrix`, `Team_Role_Assignments`, `Owner_Contract_Matrix`, `Sub_Contract_Matrix`
- Operations: `Risk_Cost_Management`, `Risk_Cost_Items`, `Quality_Concerns`, `Safety_Concerns`
- Schedule: `Project_Schedule`, `Critical_Path_Items`, `Schedule_Activities`, `Schedule_Imports`
- Plans: `Superintendent_Plan`, `Superintendent_Plan_Sections`, `Project_Management_Plans`, `PMP_Signatures`, `PMP_Approval_Cycles`, `PMP_Approval_Steps`
- Reviews: `Monthly_Reviews`, `Monthly_Checklist_Items`, `Monthly_Follow_Ups`
- Logs: `Constraints_Log`, `Permits_Log`, `Lessons_Learned`, `Marketing_Project_Record`, `Interview_Prep`

## 3. Column Mapping Strategy

`columnMappings.ts` provides a single source of truth mapping between TypeScript property names and SharePoint internal column names. This indirection prevents hard-coding SP column names throughout business logic.

Pattern: `SharePointDataService` methods reference column mappings when constructing OData `$select`, `$filter`, and `$orderby` clauses. If a SharePoint column is renamed, only `columnMappings.ts` needs to change.

## 4. Caching Architecture

**CacheService** (`packages/hbc-sp-services/src/services/CacheService.ts`):
- Dual-layer: in-memory Map + sessionStorage fallback
- 47 `CACHE_KEYS` defined in `constants.ts` (covering roles, flags, config, leads, scorecards, estimates, projects, portfolios, workflows, permissions, etc.)
- Default TTL: `CACHE_TTL_MS = 15 * 60 * 1000` (15 minutes)
- Cache invalidation on mutations via `cacheService.clear(key)`

**TanStack Query v5 Integration**:
- `staleTime` / `gcTime` configured per domain hook
- Query keys follow `['domain', 'entity', ...params]` convention
- Mutations invalidate related query keys via `queryClient.invalidateQueries()`

## 5. Paging Architecture

**Interfaces**: `ICursorPageRequest` (pageSize, token, projectCode, filters) / `ICursorPageResult<T>` (items, nextToken, hasMore, totalApprox).

**Client-side paging**: `paginateArray()` utility slices in-memory arrays based on cursor token position. Used by MockDataService and SharePointDataService for lists with `top()` caps.

**ListThresholdGuard** (Phase 5D):
- `ThresholdLevel` enum: `Safe` (<3000), `Warning` (3000-4499), `Critical` (>=4500)
- `checkThreshold(listName, itemCount)`: Instance method on `listThresholdGuard` singleton. Returns level, message, shouldForceCursorPaging, itemCount, threshold.
- `shouldForceCursorPaging`: `false` at Warning (telemetry only), `true` at Critical.
- `static shouldUseCursorPaging(itemCount, isInfinitePagingEnabled)`: Dual-gate. Returns `true` ONLY when count >= 4500 AND flag is ON.
- Applied in `SharePointDataService.getAuditLogPage()` for Audit_Log threshold monitoring.

**Feature flag**: `InfinitePagingEnabled` gates cursor-based infinite query paging globally. Domain-specific flags (`InfinitePaging_AuditCompliance`, `InfinitePaging_OpsLogs`, `InfinitePaging_StartupRisk`) enable per-surface.

## 6. Graph API Integration

**GraphService** (10 methods): `getCurrentUserProfile`, `getUserPhoto`, `getGroupMembers`, `addGroupMember`, `batchAddGroupMembers`, `batchGetUserPhotos`, `getCalendarAvailability`, `createCalendarEvent`, `sendEmail`, `createTeamsChat`.

**GraphBatchService**: Wraps the Graph `/$batch` endpoint. `MAX_BATCH_SIZE = 20` (Graph API hard limit). Auto-chunks larger request sets. Correlates responses by sequential ID. Error classification: transient (429/5xx) vs permanent (400/401/403).

**GraphBatchEnforcer** (Phase 5D): Composition wrapper around GraphBatchService.
- 10ms coalescence window via `setTimeout`
- Threshold of 3 for immediate flush
- Feature-gated via `GraphBatchingEnabled` (default OFF, zero-overhead passthrough when OFF)
- Direct constructor-injected `isFeatureEnabled: () => boolean` via closure over module-level `_isFeatureEnabled`
- `initializeEnforcerFeatureCheck()` binds real flag accessor in `GraphService.initialize()`
- Audit: `AuditAction.BatchEnforcerCoalesced` on every flush

## 7. Connector Framework

**IConnectorAdapter** interface: `testConnection()`, `syncData(direction)`, `getSchema()`, `mapFields()`.

**ConnectorRegistry**: Factory-based adapter registration. `registerAdapter(type, factory)` / `getAdapter(type)`.

**Adapters**:
- `ProcoreAdapter`: Bidirectional (RFIs, budget, projects, sync conflicts). 15 Procore-specific IDataService methods.
- `BambooHRAdapter`: Inbound-only (employees, org chart, time off, employee mappings). 10 BambooHR-specific IDataService methods.
- 9 base connector methods (getConnectors, getConnector, testConnectorConnection, triggerConnectorSync, etc.)

**IConnectorRetryPolicy**: Per-adapter retry/backoff configuration. `isTransientError()` classifies retryable failures.

## 8. Pluggable Backend Adapters

`DataProviderFactory` (`packages/hbc-sp-services/src/factory/DataProviderFactory.ts`):
- Reads `VITE_DATA_SERVICE_BACKEND` env var: `sharepoint` (default) | `azuresql` | `dataverse`
- `AzureSqlDataService` + `DataverseDataService` skeletons in `packages/hbc-sp-services/src/adapters/`
- Both use `createNotImplementedService()` Proxy — throws `NotImplementedError` with backend + method metadata for all 276 methods
- Additive pattern: existing direct MockDataService/SharePointDataService instantiation unchanged
- Enables Gen 2 (Azure SQL hosted PWA) and Gen 3 (Dataverse native mobile) without UI or business logic changes

## 9. Mock Data Fixtures

`MockDataService` provides rich fixture data for all 276 methods:
- **featureFlags.json**: 58 flags (id 1-58) with FeatureName, DisplayName, Enabled, EnabledForRoles, TargetDate, Notes, Category
- **Connector fixtures**: Procore and BambooHR mock adapters with realistic sync history, field mappings, and error simulation
- **Lead/Scorecard data**: Full lifecycle mock data from Lead-Discovery through Active-Construction
- **Schedule data**: Mock P6-style activities with dependencies for Gantt chart testing

Mock mode is the absolute default (no `.env` required). Used for:
- Local development (`npm run dev`)
- Jest unit tests (all 791+ tests)
- Storybook component stories
- Playwright E2E tests (via `roleFixture.ts`)

## 10. Data Flow Diagrams

**Read Request Lifecycle**:
```
UI Component
  -> TanStack Query hook (useQuery)
    -> queryFn calls IDataService method
      -> CacheService check (hit? return cached)
      -> SharePoint REST API / Graph API / Mock data
    -> Response cached in CacheService + TanStack Query cache
  -> UI re-renders with data
```

**Mutation Lifecycle**:
```
UI Action (form submit, button click)
  -> TanStack Query mutation (useMutation)
    -> mutationFn calls IDataService method
      -> SharePoint REST API / Graph API
      -> logAudit() (fire-and-forget)
    -> onSuccess: queryClient.invalidateQueries([...related keys])
  -> UI re-renders with fresh data
```

**Graph Batch Enforcer Flow** (when GraphBatchingEnabled ON):
```
Multiple enqueue() calls within 10ms
  -> Queue accumulates IBatchRequest entries
  -> Flush triggered (threshold 3 OR 10ms timer)
    -> graphBatchService.executeBatch(requests)
    -> Correlate responses by ID
    -> Resolve/reject individual deferred promises
    -> Log AuditAction.BatchEnforcerCoalesced
```

**Threshold Guard Flow** (in getAuditLogPage):
```
getAuditLogPage(request)
  -> getAuditLog(...) returns rows
  -> listThresholdGuard.checkThreshold('Audit_Log', rows.length)
  -> if level !== Safe: logAudit(ListThresholdWarning) [fire-and-forget]
  -> paginateArray(rows, request)
```
