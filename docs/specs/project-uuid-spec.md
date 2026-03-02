# Project UUID Implementation Specification

**Document ID**: HBC-PC-UUID-001  
**Version**: 1.0 (aligned with navigation context requirements and commit c8a3f611d0951989d45df86f4b466bea1267dcbc)  
**Status**: Implemented (Phases 1-7 complete, behind `ProjectUuidNavigation` feature flag)
**Last Updated**: 2026-03-02
**Governing Instruction**: All development of `Project` models, `@hbc/sp-services` project methods, migration scripts, `useCurrentProject` hook, column mappings, create/update flows, and any related components MUST retrieve this document first via MCP (`find_relevant_context`) before any implementation. No hard-coded values, labels, IDs, or logic allowed outside this spec.

## 1. Purpose and Business Drivers

Replace the current composite key (`project_code` + `lead_id`) with a single, immutable `projectUuid` (GUID) to:
- Enable reliable URL parameter handoff (`?projectUuid=xxx`) for Procore-style navigation.
- Eliminate brittleness caused by mutable `project_code` values and projects without `lead_id`.
- Serve as the canonical identifier for all single-project filtering, deep links, and Project Hub drill-downs while preserving multi-project department views.

This UUID is generated once at project creation and never changes.

## 2. SharePoint List Schema — Provisioning Notes

### Primary List: `Active_Projects_Portfolio` (constant: `HUB_LISTS.ACTIVE_PROJECTS_PORTFOLIO` or `LIST_NAMES.PROJECTS`)

#### New Identity Column

| Column (Internal Name) | SP Type          | Notes |
|------------------------|------------------|-------|
| `projectUuid`          | Single line of text | Required, Indexed, Read-only after creation. Generated via `crypto.randomUUID()`. Never editable. |

- Do not add to default views or forms (internal system field).
- Apply the same column to any secondary lists referencing projects (e.g., `Leads_Master` if applicable).

### Related Lists (if project records exist there)
- `Leads_Master` – add identical `projectUuid` column for consistency.

## 3. TypeScript Models & Mappings

- `packages/hbc-sp-services/src/models/IActiveProject.ts` (or `Project.ts`):  
  Add `projectUuid: string;` (required, non-nullable).

- `packages/hbc-sp-services/src/services/columnMappings.ts`:  
  Map `projectUuid` following existing field patterns (no point values or scoring logic).

## 4. Service Layer Requirements (centralized)

All project operations in `SharePointDataService.ts` (and `IDataService` interface) must:
- On **createProject**: `projectUuid: crypto.randomUUID()`.
- On **getProjects**, **getProjectById**, **updateProject**, etc.: always select and return `projectUuid`.
- Add new method: `getProjectByUuid(uuid: string)`.
- Support filtering: `filter: \`projectUuid eq '\${uuid}'\`` (exact match only).
- Deprecate (but retain for 30-day transition) all composite `project_code` + `lead_id` logic with explicit comment referencing this document.

## 5. One-Time Migration Procedure

Run exactly once (via temporary admin route or Power Automate flow) before code deployment:

```ts
// Temporary method – add to SharePointDataService.ts only for migration
async migrateProjectUuids() {
  const items = await this.getAllProjects({ 
    select: ['Id', 'projectUuid'], 
    filter: 'projectUuid eq null' 
  });
  for (const item of items) {
    const uuid = crypto.randomUUID();
    await this.updateProject(item.Id, { projectUuid: uuid });
  }
}
```

Verify zero null projectUuid values post-migration before proceeding.

6. Creation & Update Rules

Every new project (regardless of entry point: Business Development, Estimating, etc.) MUST generate and persist projectUuid.
No updates allowed to an existing projectUuid (enforce via SP list settings or service guard).
All TanStack Query keys involving projects MUST include projectUuid when present.

7. Validation & Audit

Add index on projectUuid for performance.
Telemetry: log UUID generation and first usage.
Post-migration validation query: return count of items where projectUuid eq null.

This specification is the sole source of truth for UUID-related development.