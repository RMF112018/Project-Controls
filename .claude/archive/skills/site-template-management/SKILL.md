---
name: HBC Site Template Management
description: Selectable site templates (Default, Commercial, Luxury Residential) maintained by SharePoint admins, with GitOps sync capability, admin UI tab, and saga integration. Enables HBC to maintain different project-site structures per division while keeping version-controlled templates in Git.
version: 1.1
category: core-services
triggers: site-template, template-management, ISiteTemplate, SiteTemplateType, TemplateSyncStatus, GitOps, template-sync, applyTemplateToSite, syncTemplateToGitOps, SiteTemplateManagement, template-crud, template-admin, templateSyncGuard, acquireSyncLock, validateTemplateContent, assertSyncApproved, multi-approver
updated: 2026-02-24
---

# HBC Site Template Management Skill

**Activation**
Implementing, extending, debugging, or optimizing any site template CRUD operations, GitOps sync flows, template application during provisioning, or the admin Site Templates tab in the HBC Project Controls suite (post Phase 6A, Feb 2026).

**Protocol**
1. All template operations MUST go through the 8 `IDataService` methods: `getSiteTemplates`, `getSiteTemplateByType`, `createSiteTemplate`, `updateSiteTemplate`, `deleteSiteTemplate`, `syncTemplateToGitOps`, `applyTemplateToSite`, `syncAllTemplates`. Direct SP list or API calls are prohibited outside the service layer.
2. Feature flag discipline: `SiteTemplateManagement` (id 60, default OFF, EnabledForRoles: ExecutiveLeadership + SharePointAdmin). Admin UI tab wrapped in `FeatureGate`. ProvisioningSaga dual-path: when flag OFF or `templateName` absent on `IProvisioningInput`, legacy `copyTemplateFiles` path runs unchanged.
3. ISiteTemplate model: `Title` is typed as `SiteTemplateType = 'Default' | 'Commercial' | 'Luxury Residential'`. `SyncStatus` uses `TemplateSyncStatus` enum (`Idle | Syncing | Success | Failed`).
4. Column mappings: `SITE_TEMPLATES_COLUMNS` in `columnMappings.ts`. SP list name: `Site_Templates` in `HUB_LISTS`. Cache key: `hbc_site_templates` in `CACHE_KEYS`.
5. Audit logging: `AuditAction.TemplateSyncStarted`, `TemplateSyncCompleted`, `TemplateSyncFailed` with `EntityType.SiteTemplate`. Every mutation logs to audit.
6. Default fallback rule: `applyTemplateToSite` falls back to Default template when requested type not found (SOC2 audit on fallback). If no Default template is active, the method throws — saga Step 5 fails and compensation triggers.
7. GraphBatchEnforcer + ListThresholdGuard applied in SharePointDataService implementations for sync operations and audit log writes.

**ISiteTemplate Model**
```typescript
export type SiteTemplateType = 'Default' | 'Commercial' | 'Luxury Residential';
export interface ISiteTemplate {
  id: number;
  Title: SiteTemplateType;
  TemplateSiteUrl: string;
  ProjectTypeId: number | null;
  GitRepoUrl: string;
  LastSynced: string | null;
  SyncStatus: TemplateSyncStatus;
  IsActive: boolean;
  Description?: string;
  CreatedBy?: string;
  ModifiedAt?: string;
}
```

**8 IDataService Methods (Phase 6A)**

| # | Method | Returns | Notes |
|---|--------|---------|-------|
| 1 | `getSiteTemplates()` | `ISiteTemplate[]` | All templates, cached |
| 2 | `getSiteTemplateByType(type)` | `ISiteTemplate \| null` | Active only, returns null if inactive/missing |
| 3 | `createSiteTemplate(data)` | `ISiteTemplate` | Auto-generates id, audit logged |
| 4 | `updateSiteTemplate(id, data)` | `ISiteTemplate` | Throws for non-existent id |
| 5 | `deleteSiteTemplate(id)` | `void` | Throws for non-existent id, cache invalidated |
| 6 | `syncTemplateToGitOps(id)` | `{ success, prUrl?, error? }` | Transitions Syncing->Success/Failed, audit logged |
| 7 | `applyTemplateToSite(url, type)` | `{ appliedCount, templateName }` | Falls back to Default, throws if no Default |
| 8 | `syncAllTemplates()` | `{ synced, failed, results[] }` | Syncs all active templates |

**ProvisioningSaga Integration (Step 5 Dual-Path)**
```typescript
// In ProvisioningSaga.buildSteps(), Step 5:
execute: async (ctx) => {
  if (ctx.input.templateName) {
    await ctx.dataService.applyTemplateToSite(ctx.siteUrl, ctx.input.templateName);
  } else {
    await ctx.dataService.copyTemplateFiles(ctx.siteUrl, ctx.input.projectCode, ctx.input.division);
  }
},
```
- Saga does NOT check feature flags. UI layer passes `templateName` only when `SiteTemplateManagement` flag is ON.
- Compensation remains unchanged: `removeTemplateFiles` works for both paths.
- `IProvisioningInput.templateName?: 'Default' | 'Commercial' | 'Luxury Residential'`

**GitOps Sync Flow**
1. `syncTemplateToGitOps(id)` called → `TemplateSyncStarted` audit action
2. Template status transitions: `Idle/Success/Failed` → `Syncing`
3. Real GitHub sync deferred to Power Automate; mock returns success + mock PR URL
4. On success: `TemplateSyncCompleted` audit → `SyncStatus = Success`, `LastSynced` updated
5. On failure: `TemplateSyncFailed` audit → `SyncStatus = Failed`

**Admin UI (ProvisioningPage Tab)**
- Tab 1: "Provisioning Logs" — existing content (unchanged)
- Tab 2: "Site Templates" — wrapped in `FeatureGate featureName="SiteTemplateManagement"`
- KPI strip: Total Templates, Active, Last Synced
- HbcTanStackTable: Title, Sync Status (StatusBadge), Active, Last Synced, Template Site
- Row actions: Edit (opens SlideDrawer), Sync to GitOps (loading state)
- SlideDrawer: Template Type dropdown, Template Site URL, Git Repo URL, Project Type ID, Description, Active toggle
- Data-testid: `site-templates-tab`, `site-templates-table`, `sync-button-{id}`, `template-edit-drawer`

**Edge Cases**
| Scenario | Behavior |
|----------|----------|
| Flag OFF | Tab hidden; provisioning uses legacy `copyTemplateFiles` |
| Flag ON + no `templateName` in input | Falls back to legacy path (backward compat) |
| Requested template type not found | Falls back to Default + SOC2 audit |
| No Default template active | Throws → saga step 5 fails → compensation triggered |
| Large template site (5000+ items) | ListThresholdGuard forces cursor paging |
| GitOps sync failure | Audit logged, toast shown, retry via button |
| Mock mode | Full in-memory, no real SP/GitHub calls |
| Non-admin user | FeatureGate + EnabledForRoles blocks tab rendering |

**Manual Test Steps**
1. Enable `SiteTemplateManagement` flag → Navigate to Admin > Provisioning → Verify "Site Templates" tab appears.
2. Click "Add Template" → Fill form → Save → Verify new template in table.
3. Click "Edit" on existing template → Modify description → Save → Verify update persists.
4. Click "Sync" on a template → Verify SyncStatus transitions to Success + toast shown.
5. Disable flag → Verify tab content is hidden (FeatureGate fallback).
6. Switch to non-admin role → Verify template tab content is not accessible.

**Reference**
- `CLAUDE.md` §7 (284 methods), §15 (Phase 6A), §16 (template pitfalls)
- `packages/hbc-sp-services/src/models/ISiteTemplate.ts`
- `packages/hbc-sp-services/src/services/ProvisioningSaga.ts` (Step 5 dual-path)
- `packages/hbc-sp-services/src/services/columnMappings.ts` (SITE_TEMPLATES_COLUMNS)
- `src/webparts/hbcProjectControls/components/pages/admin/ProvisioningPage.tsx` (SiteTemplatesTab)
- `.claude/skills/provisioning-engine/SKILL.md` v1.3 (template integration)
- `.claude/skills/resilient-data-operations/SKILL.md` v1.4 (template sync resilience)
- `.claude/skills/elevated-ux-ui-design/SKILL.md`
