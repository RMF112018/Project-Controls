**CLAUDE.md — HBC Project Controls Blueprint (Lean Edition)**

**Performance Rule (Critical)**
This file must stay under 40,000 characters. Never allow it to grow large again. When it approaches the limit, archive older content to CLAUDE_ARCHIVE.md.

**Update Rules (Mandatory)**
Update this file at these specific intervals:
- After every completed data service chunk (SP-8, SP-9, etc.) → update §7 Service Methods Status and §15 Current Phase Status
- After any major architecture or pattern change → update relevant sections (§4, §16)
- After adding new models, enums, or important constants → update §6 Data Models or §13 Constants if critical
- Every 3–4 chunks or when the file exceeds 35k characters → prune non-essential history to CLAUDE_ARCHIVE.md
- Always keep the file focused on: current status, active rules, recent chunks, and live references.

For full historical phase logs (SP-1 through SP-7), complete 221-method table, old navigation, and detailed past pitfalls → see **CLAUDE_ARCHIVE.md**.

**Last Updated:** 2026-02-15 — Project Data Mart feature (225 methods, +4 new)

**MANDATORY:** After every code change that affects the data layer, update the relevant sections before ending the session.

---

## §0 Development Workflow Rules

- **After any meaningful code change**, run `/verify-changes` and show the full output before concluding the task.
- **Never mark work complete** until verification passes (TypeScript, ESLint, tests).
- **Before commits and PRs**, run `/verify-full-build` to confirm the full production build succeeds.
- **After completing a data service chunk**, run `/review-chunk` to scan real stub counts and generate CLAUDE.md updates.
- **Available commands**: `/verify-changes` (quick), `/verify-full-build` (full), `/status` (overview), `/permissions` (allowlist), `/sp-progress` (stub scan), `/review-chunk` (post-chunk).

### Command Evolution Guidelines
- **Add** a command when: a workflow repeats 3+ times/week, manual execution is error-prone, or it has clear success/failure criteria.
- **Modify** a command when: user feedback indicates friction, codebase structure changes, or new requirements emerge.
- **Retire** a command when: unused for 3+ months, superseded by a better command, or its phase is complete.

---

## §1 Tech Stack & Build (Current)

- **Framework**: SPFx 1.21.1 + React 18.2.0 + Fluent UI v9 (makeStyles + tokens)
- **Data Layer**: `@hbc/sp-services` monorepo package (shared library)
- **Key Commands**:
  - `npm run dev` → Standalone dev server + RoleSwitcher
  - `gulp serve --nobrowser` → SPFx workbench
  - `npm run build` → Full production build (lib → app)
  - `npm run test:ci` → Jest coverage

---

## §4 Core Architecture Patterns (Active)

- **Data Service**: `IDataService` (225 methods) → `MockDataService` (full) + `SharePointDataService` (225/225 — COMPLETE)
- **Data Mart**: Denormalized 43-column hub list aggregating 8+ project-site lists; fire-and-forget sync from hooks; `useDataMart` hook with SignalR refresh
- **Hooks**: Feature-specific hooks call `dataService` methods in `useCallback`
- **RBAC**: `resolveUserPermissions` → `PermissionGate` / `RoleGate` / `FeatureGate`
- **Styling**: `makeStyles` (structure) + minimal inline (dynamic) + Fluent tokens + `HBC_COLORS`
- **Routing**: `HashRouter` + `React.lazy()` + `Suspense` (40 lazy-loaded pages)
- **Audit**: Fire-and-forget `this.logAudit()` with debounce
- **Cross-site Access**: `_getProjectWeb()` helper in SharePointDataService

---

## §7 Service Methods Status (Live)

**Total methods**: 225
**Implemented**: 225
**Remaining stubs**: 0 — DATA LAYER COMPLETE

**Last Completed**:
- Data Mart (Feb 15): 4 methods (`syncToDataMart`, `getDataMartRecords`, `getDataMartRecord`, `triggerDataMartSync`) → 225/225
- SP-13 (Feb 15): Action Inbox — 1 method → 221/221
- SP-12 (Feb 15): Help & Support — 6 methods → 220/221
- SP-11 (Feb 15): Performance Monitoring — 3 methods → 214/221
- SP-10 (Feb 15): Scorecard Workflow — 9 methods → 211/221

**Note**: `sendSupportEmail` is a deliberate no-op (requires Graph API not yet available).

---

## §15 Current Phase Status

**Phase COMPLETE**: Project Data Mart — 225/225 methods implemented.

All IDataService methods have SharePoint REST implementations. The Data Mart feature adds a 43-column denormalized hub list (`Project_Data_Mart`) that aggregates data from 8+ project-site lists. Fire-and-forget sync triggers in 5 hooks (Turnover, Monthly Review, Commitment, Schedule, Risk/Cost). UI integration: `useDataMart` hook, DashboardPage portfolio health KPIs, ActiveProjectsDashboard Data Mart view toggle, PipelinePage health badge.

**Next Phase**: Integration testing and deployment readiness.

---

## §16 Active Pitfalls & Rules

(Only the most relevant current ones are kept here. Full historical list is in CLAUDE_ARCHIVE.md)

- Always use `columnMappings.ts` — never hard-code column names.
- Call `this.logAudit()` on every mutation.
- Use `_getProjectWeb()` for project-site lists.
- Hub-site reference data (e.g. Division_Approvers, PMP_Boilerplate) uses `this.sp.web`.
- After mutations that affect assemblies, always re-read + re-assemble (e.g. PMP, Monthly Review, Turnover Agenda).
- `Turnover_Estimate_Overviews` is a new SP list — must be provisioned before feature goes live.
- `Project_Data_Mart` is a new hub-site SP list (43 columns) — must be provisioned before Data Mart feature goes live.
- Data Mart sync is fire-and-forget — never await in hooks; use `.catch(() => { /* silent */ })`.
- Keep `CLAUDE.md` lean — archive old content aggressively.

---

**For complete history, full method tables, old navigation, and detailed past phases → see CLAUDE_ARCHIVE.md**