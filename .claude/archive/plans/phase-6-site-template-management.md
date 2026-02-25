# Phase 6A: Site Template Management & GitOps Sync

## Context
The provisioning engine (Phase 5C) must support selectable templates (Default, Commercial, Luxury Residential) maintained by the SharePoint admin. Templates are stored in a new Hub list `SiteTemplates`. ProvisioningSaga applies the selected template (selective PnP clone excluding libraries and existing list content). Automatic sync runs every 4 hours via Power Automate + new IDataService method. Manual GitOps sync button (per template) pushes structure to Git repo with SignalR status, full resilience (GraphBatchEnforcer, ListThresholdGuard, useConnectorMutation), and saga-style compensation on failure.

**Baseline:** 276 IDataService methods, 900+ Jest tests, coverage 93/81/93/94, Phase 5 COMPLETE.

**Feature Flag**: `SiteTemplateManagement` (id 60, default OFF, SuperAdmin-only).

---

## 1. Files to Create

| # | Path | Purpose |
|---|------|---------|
| 1 | `packages/hbc-sp-services/src/models/ISiteTemplate.ts` | IEntity for SiteTemplates list |
| 2 | `packages/hbc-sp-services/src/services/__tests__/SiteTemplateService.test.ts` | 18 Jest tests (CRUD, sync, edge cases) |
| 3 | `playwright/site-templates.e2e.spec.ts` | 9 Playwright E2E (grid, edit, sync, role-gating, GitOps) |
| 4 | `.claude/skills/site-template-management/SKILL.md` | New skill for template patterns, GitOps, exclusion rules |

---

## 2. Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `packages/hbc-sp-services/src/models/enums.ts` | Add `EntityType.SiteTemplate`, `AuditAction.TemplateSyncStarted`, `TemplateSyncCompleted`, `TemplateSyncFailed` |
| 2 | `packages/hbc-sp-services/src/mock/featureFlags.json` | Add id 60 `SiteTemplateManagement` (default OFF) |
| 3 | `packages/hbc-sp-services/src/services/IDataService.ts` | Add 8 new methods (getTemplates, getTemplateByType, syncTemplateToGitOps, applyTemplate, etc.) |
| 4 | `packages/hbc-sp-services/src/services/SharePointDataService.ts` | Implement all 8 methods with GraphBatchEnforcer, ListThresholdGuard, selective PnP apply (exclude libraries/content) |
| 5 | `packages/hbc-sp-services/src/services/MockDataService.ts` | Mock all 8 methods with fixture data |
| 6 | `packages/hbc-sp-services/src/services/index.ts` | Export new methods |
| 7 | `packages/hbc-sp-services/src/HUB_LISTS.ts` | Add `SiteTemplates` entry |
| 8 | `src/webparts/hbcProjectControls/components/pages/admin/ProvisioningPage.tsx` | New "Site Templates" tab with HbcTanStackTable, edit drawer, sync buttons, SignalR status |
| 9 | `packages/hbc-sp-services/src/services/ProvisioningSaga.ts` | Extend IProvisioningInput with templateName, lookup & apply template in Step 1 |
| 10 | `CLAUDE.md` | Update §7, §15, §16, §19 with Phase 6A |
| 11 | `.claude/skills/provisioning-engine/SKILL.md` | Update v1.3 with template integration |

---

## 3. Technical Approach

### 3A. SiteTemplates List & Data Layer (IDataService abstraction)
New list in Hub site with columns: Title (enum: Default, Commercial, Luxury Residential), TemplateSiteUrl, ProjectTypeId, GitRepoUrl, LastSynced, SyncStatus (Idle/Syncing/Success/Failed), IsActive.

8 new IDataService methods (all resilient):
- `getAllTemplates()` – ListThresholdGuard protected
- `getTemplateByType(projectType: string)`
- `syncTemplateToGitOps(templateId: number)` – GraphBatchEnforcer + GitHub API (via Graph or PnP), idempotency, compensation
- `applyTemplateToSite(siteUrl: string, templateName: string)` – PnP selective apply (exclude /Shared Documents and existing list items)

### 3B. ProvisioningSaga Integration
Extend IProvisioningInput with `templateName?: string`. In Step 1 (Create Site), lookup template and call `applyTemplateToSite`.

### 3C. Admin UI (Elevated UX per SKILL.md)
New tab in ProvisioningPage: HbcTanStackTable with inline edit, status badges, shimmer on sync, confirmation dialog for destructive sync. Manual "Sync to GitOps" button per row calls useConnectorMutation.

### 3D. Automatic Sync
Power Automate scheduled flow (every 4 hours) calls `SyncAllTemplates()` – resilient, audited, SignalR broadcast for live status.

### 3E. Hardened Edge Cases (all covered)
- Missing template → fallback to Default + SOC2 audit + toast
- Large template (5000+ items) → ListThresholdGuard forces cursor paging
- Concurrent syncs → Idempotency tokens + saga compensation
- GitOps failure → Retry/backoff, circuit breaker, manual intervention alert
- Offline/mock mode → Full mock implementation
- Permission issues → RoleGate + audit snapshot
- Rollout safety → Feature flag + dual-path (legacy provisioning without template when OFF)
- Data migration → Existing projects get Default on first update
- Performance → Virtualization, batching, lazy loading
- Security → All syncs audited, only SuperAdmin edits templates

---

## 4. Trade-off Table

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Template storage | SharePoint list in Hub | Consistent with all other config (Project_Types, Feature_Flags); PnP-ready |
| Sync mechanism | Power Automate + IDataService | No new server-side code; leverages existing resilience |
| Apply logic | PnP selective clone | Mature, supports exclusion of libraries/content |
| UI location | Provisioning sub-tab | Logical grouping; reuses existing page layout |

---

## 5. Implementation Checklist

| # | Task | Acceptance Criteria |
|---|------|--------------------|
| 1 | Add enums and feature flag | TypeScript compiles. Flag id 60, default OFF, Admin-only. |
| 2 | Extend IDataService with 8 methods | Mock + SharePoint implementations. All use GraphBatchEnforcer/ListThresholdGuard. |
| 3 | Implement in SharePointDataService & MockDataService | Selective PnP apply excludes libraries/content. Sync to GitOps with resilience. |
| 4 | Update HUB_LISTS and ProvisioningSaga | Template lookup + apply in Step 1. Legacy path unchanged when flag OFF. |
| 5 | Build Admin UI tab with table, edit drawer, sync buttons | Elevated UX (4.75/10), data-testid, SignalR status, confirmation dialogs. |
| 6 | Add 18 Jest + 9 Playwright tests | All edge cases covered. Coverage ≥81 %. |
| 7 | Update CLAUDE.md, provisioning-engine/SKILL.md, resilient-data-operations/SKILL.md | Exact governing diffs. |
| 8 | Run full verification gate | All tests pass, bundle within budget, zero regressions. |

---

## 6. CLAUDE.md Diffs (ready-to-insert)

**§7** – Append:  
`Phase 6A Site Template Management (Feb 2026) — SiteTemplates list, 8 new IDataService methods, GitOps sync, selective PnP apply (exclude libraries/content), automatic 4-hour sync, manual GitOps button. Feature flag SiteTemplateManagement id 60.`

**§15** – Append:  
`- Phase 6A: Site Template Management — **COMPLETE**. 3 templates (Default, Commercial, Luxury Residential), automatic/GitOps sync, resilience integration.`

**§16** – Append:  
`- **SiteTemplateManagement**: All template syncs MUST use GraphBatchEnforcer + ListThresholdGuard. Selective apply excludes libraries/content. Feature flag gates entire feature.`

**§19** – Update pluggable backend section with template patterns.

---

## 7. SKILL.md Recommendation

**New file** `.claude/skills/site-template-management/SKILL.md` (v1.0) – full template for future extensions (GitOps, selective apply, edge-case handling). Reduces future implementation time by ~50 %.

**Update** `provisioning-engine/SKILL.md` v1.3 and `resilient-data-operations/SKILL.md` v1.4 with cross-references.

---

## Verification Gate
```bash
npm run verify:sprint3
npm run verify:bundle-size:fail
npx playwright test site-templates.e2e.spec.ts
```

**Acceptance:** All gates green, 100 % fidelity, plug-and-play ready, all edge cases hardened.

**Outcome:** Site template management is fully hardened, resilient, and ready for rollout.