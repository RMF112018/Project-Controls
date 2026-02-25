---
name: HBC Provisioning Engine
description: Robust, idempotent 7-step SharePoint site provisioning engine for the HBC Project Controls suite – handling new project request workflows from approval to fully provisioned project hub/child sites (41 lists, Entra ID sync, audit logging) using Graph API primary path with PowerAutomate fallback. Ensures construction-grade reliability, auditability, and extensibility for large-scale project lifecycle management.
version: 1.4
category: core-services
triggers: provisioning, ProvisioningService, site-provisioning, 7-step-engine, IProvisioningInput, IProvisioningResult, PowerAutomate, GitOps, new-project-request, workspace-creation, GraphBatchEnforcer, ListThresholdGuard, SiteTemplateManagement, applyTemplateToSite, rollback, idempotencyToken, templateVersion, getProvisioningLogByToken
updated: 2026-02-24
---

# HBC Provisioning Engine Skill

**Activation**  
Implementing, extending, debugging, or optimizing any part of the site provisioning lifecycle, new project request approval flows that trigger provisioning, or direct usage of `ProvisioningService` across the HBC Project Controls application after activation (post 23 Feb 2026).

**Protocol**  
1. All provisioning operations MUST go through `ProvisioningService.provisionSite(input: IProvisioningInput)` abstraction in `@hbc/sp-services`. Direct Graph or PnP calls are prohibited outside the service.  
2. Strictly follow the 7-step idempotent engine: 1) Validate, 2) Create Site (Graph), 3) Apply PnP template, 4) Provision Lists & Content Types (41), 5) Entra ID Group Sync & Permissions, 6) Notification & Handoff, 7) Audit Logging & Completion.  
3. Use pluggable providers (Graph primary, PowerAutomate fallback, Mock for tests) controlled by feature flag `provisioningEngineV2`.  
4. Every step must implement retry logic (exponential backoff, max 3 retries) and support compensation/rollback for partial failures (saga pattern).  
5. All mutations require non-blocking `logAudit()` to `Provisioning_Log` list with full context.  
6. UI integrations (wizard, status polling) must use TanStack Query mutations with proper optimistic updates and error boundaries.  
7. New extensions (e.g. Procore connector post-provisioning) must be added as postStep hooks and immediately documented in this SKILL.md and CLAUDE.md.  
8. Post-change verification: Update CLAUDE.md §7 & §16, run full E2E provisioning test suite + audit log validation.

**7 Critical Flows Guaranteed Stable**  
1. New Project Request → Approval → Auto-Provisioning Trigger (BD/Estimating roles).  
2. Full 7-step Graph provisioning of Hub-to-Project child site with 41 standard lists.  
3. Idempotent re-run handling for partially failed provisioning jobs (resume from failed step).  
4. PowerAutomate fallback path for environments with strict policy controls.  
5. Real-time status polling and progress visualization in Admin → Provisioning Dashboard.  
6. Entra ID security group creation + role-based permission assignment (14 roles).  
7. End-to-end audit trail from workflow approval through site handoff.

**Manual Test Steps**  
1. Submit a new project request as Business Development → Verify it reaches Go/No-Go and triggers provisioning on approval.  
2. Monitor provisioning status in Admin panel → Confirm all 7 steps complete with correct logging in Provisioning_Log.  
3. Intentionally fail step 3 (template application) → Verify compensation and retry/resume behavior.  
4. Switch to Mock data provider → Confirm wizard and status flows work without external calls.  
5. Test on both primary Graph path and PowerAutomate fallback → Validate identical end results.  
6. Enable `prefers-reduced-motion` and test long-running provisioning progress indicators.

**Reference**  
- `CLAUDE.md` §7 (Service Methods – ProvisioningService), §12 (Feature Flags), §16 (Active Pitfalls & Rules)  
- `DATA_ARCHITECTURE.md` (Provisioning_Log schema, columnMappings)  
- `PERMISSION_STRATEGY.md` (Provisioning permissions)  
- `SECURITY_ANALYSIS.md` (Graph scopes for site creation)  
- HBC Elevated UI/UX Design Skill (for provisioning wizard polish)
- `.claude/skills/elevated-ux-ui-design/SKILL.md`

**Phase 5C.1 Resilience Integration**
- GraphBatchEnforcer wired in all saga Graph steps.
- ListThresholdGuard applied to Audit_Log in saga.
- E2E expanded for compensation rollback.

**Phase 6A Site Template Integration**
- ProvisioningSaga Step 5 now supports dual-path: `applyTemplateToSite` (Phase 6A) or legacy `copyTemplateFiles`.
- `IProvisioningInput.templateName?: SiteTemplateType` controls path selection. When absent, legacy path runs.
- Feature flag `SiteTemplateManagement` (id 60) gates UI; saga itself is flag-agnostic.
- Default fallback: if requested template type not found, falls back to Default template (SOC2 audit).
- No Default active → throws → saga Step 5 fails → compensation triggered.
- See `.claude/skills/site-template-management/SKILL.md` v1.0 for full template protocol.