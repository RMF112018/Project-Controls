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

**Last Updated:** 2026-02-15 — SP-7: Project Management Plan (PMP) — 7 methods implemented (176 of 221 total)

**MANDATORY:** After every code change that affects the data layer, update the relevant sections before ending the session.

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

- **Data Service**: `IDataService` (221 methods) → `MockDataService` (full) + `SharePointDataService` (176/221 implemented)
- **Hooks**: Feature-specific hooks call `dataService` methods in `useCallback`
- **RBAC**: `resolveUserPermissions` → `PermissionGate` / `RoleGate` / `FeatureGate`
- **Styling**: `makeStyles` (structure) + minimal inline (dynamic) + Fluent tokens + `HBC_COLORS`
- **Routing**: `HashRouter` + `React.lazy()` + `Suspense` (40 lazy-loaded pages)
- **Audit**: Fire-and-forget `this.auditService.log()` with debounce
- **Cross-site Access**: `_getProjectWeb()` helper in SharePointDataService

---

## §7 Service Methods Status (Live)

**Total methods**: 221  
**Implemented**: 176  
**Delegation stubs**: 6  
**Remaining stubs**: 39  

**Last Completed**:
- SP-7 (Feb 15): Project Management Plan (PMP) — 7 methods
- SP-6: Hub-level CRUD & Reference Data — 21 methods
- SP-5: Risk/Cost, Quality, Safety, Schedule, Superintendent, Lessons — 19 methods

**Remaining Domains (39 stubs)**:
- Monthly Project Review (4)
- Turnover Agenda (16)
- Scorecard Workflow (9)
- Action Inbox (1)
- Performance Monitoring (3)
- Help & Support (6)

**Next Recommended Chunk**: Monthly Project Review (Chunk 8)

---

## §15 Current Phase Status

**Active Phase**: Data Layer Completion (SharePointDataService)  
**Goal**: Reach 221/221 before any new UI or features are built.

**Recent Progress**:
- SP-7: PMP (7 methods) → 176/221
- SP-6: Hub & Reference Data (21 methods) → 169/221

---

## §16 Active Pitfalls & Rules

(Only the most relevant current ones are kept here. Full historical list is in CLAUDE_ARCHIVE.md)

- Always use `columnMappings.ts` — never hard-code column names.
- Call `this.auditService.log()` on every mutation.
- Use `_getProjectWeb()` for project-site lists.
- Hub-site reference data (e.g. Division_Approvers, PMP_Boilerplate) uses `this.sp.web`.
- After mutations that affect assemblies, always re-read + re-assemble (e.g. PMP, Monthly Review).
- Keep `CLAUDE.md` lean — archive old content aggressively.

---

**For complete history, full method tables, old navigation, and detailed past phases → see CLAUDE_ARCHIVE.md**