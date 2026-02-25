# Route Coverage Audit — Phase 7 Stage 4

**Generated:** 2026-02-25
**Total routes:** 136
**Playwright-covered routes:** 14 (10.3%)
**Target:** >60% (with permission-matrix.e2e.spec.ts adding 6 workspace landings)

## Coverage Summary

| Workspace | Total Routes | Covered | Partial | Uncovered | Coverage % |
|-----------|-------------|---------|---------|-----------|------------|
| Hub (/) | 3 | 3 | 0 | 0 | 100% |
| Admin (/admin/*) | 12 | 4 | 0 | 8 | 33.3% |
| Preconstruction (/preconstruction/*) | 19 | 2 | 0 | 17 | 10.5% |
| Operations (/operations/*) | 45 | 1 | 0 | 44 | 2.2% |
| Shared Services (/shared-services/*) | 24 | 0 | 0 | 24 | 0% |
| HB Site Control (/site-control/*) | 15 | 0 | 0 | 15 | 0% |
| Project Hub (/project-hub/*) | 36 | 0 | 0 | 36 | 0% |
| **Totals** | **136** (+18 redirects) | **10** | **4** | **122** | **10.3%** |

## Coverage by Workspace

### Hub (/)
| Route | Path | Coverage | Spec File |
|-------|------|----------|-----------|
| Analytics Hub Dashboard | / | Covered | dashboard.spec.ts |
| Hub redirect: marketing | /marketing | Covered | router-branch-parity.spec.ts |
| Hub redirect: accounting | /accounting-queue | Covered | router-branch-parity.spec.ts |

### Admin (/admin/*)
| Route | Path | Coverage | Spec File |
|-------|------|----------|-----------|
| Connections | /admin/connections | Covered | connectors.e2e.spec.ts |
| Hub Site URL | /admin/hub-site | Not Covered | — |
| Workflows | /admin/workflows | Not Covered | — |
| Roles | /admin/roles | Not Covered | — |
| Permissions | /admin/permissions | Not Covered | — |
| Assignments | /admin/assignments | Not Covered | — |
| Sectors | /admin/sectors | Not Covered | — |
| Provisioning | /admin/provisioning | Covered | provisioning.spec.ts, provisioning-saga.e2e.spec.ts |
| Site Templates | /admin/site-templates | Covered | site-templates.e2e.spec.ts |
| Dev Users | /admin/dev-users | Not Covered | — |
| Feature Flags | /admin/feature-flags | Covered | guards.spec.ts (partial) |
| Audit Log | /admin/audit-log | Not Covered | — |

### Preconstruction (/preconstruction/*)
| Route | Path | Coverage | Spec File |
|-------|------|----------|-----------|
| Precon Dashboard | /preconstruction | Partial | precon-lead-router-wave3.spec.ts |
| BD Dashboard | /preconstruction/bd | Not Covered | — |
| Lead Management | /preconstruction/bd/leads | Covered | precon-lead-router-wave3.spec.ts |
| Go / No-Go | /preconstruction/bd/go-no-go | Covered | workflow-state-machines.e2e.spec.ts |
| Pipeline | /preconstruction/bd/pipeline | Partial | pipeline-estimating-table-wave2.spec.ts |
| BD Project Hub | /preconstruction/bd/project-hub | Not Covered | — |
| BD Documents | /preconstruction/bd/documents | Not Covered | — |
| Estimating Dashboard | /preconstruction/estimating | Partial | estimating-project-overview-wave5.spec.ts |
| Department Tracking | /preconstruction/estimating/tracking | Not Covered | — |
| Project Number Requests | /preconstruction/project-number-requests | Not Covered | — |
| Post-Bid Autopsies | /preconstruction/estimating/post-bid | Not Covered | — |
| Estimating Project Hub | /preconstruction/estimating/project-hub | Not Covered | — |
| Estimating Documents | /preconstruction/estimating/documents | Not Covered | — |
| IDS Dashboard | /preconstruction/ids | Not Covered | — |
| IDS Tracking | /preconstruction/ids/tracking | Not Covered | — |
| IDS Documents | /preconstruction/ids/documents | Not Covered | — |

### Operations (/operations/*)
| Route | Path | Coverage | Spec File |
|-------|------|----------|-----------|
| Operations Dashboard | /operations | Partial | operations-router-wave2.spec.ts |
| Commercial Dashboard | /operations/commercial | Not Covered | — |
| (43 additional routes) | /operations/* | Not Covered | — |

### Shared Services (/shared-services/*)
All 24 routes uncovered. Priority targets: Marketing Dashboard, Accounting Dashboard, BambooHR Directory.

### HB Site Control (/site-control/*)
All 15 routes uncovered. Priority targets: Sign-In Dashboard, Safety Dashboard, QC Dashboard.

### Project Hub (/project-hub/*)
All 36 routes uncovered (requires project selection). Priority targets: Project Dashboard, Go/No-Go, PMP.

## New Coverage from permission-matrix.e2e.spec.ts

The new permission matrix E2E spec (70 tests) adds workspace landing page coverage for all 6 workspaces across 6 roles:
- /, /preconstruction, /operations, /shared-services, /site-control, /admin
- Plus sidebar visibility and page-level permission checks

**Adjusted coverage with permission-matrix:** ~20 routes covered (14.7%)

## Recommendations (Priority Order)

1. **Update legacy route paths in existing specs** — Several specs use pre-Phase 3 paths. Updating would add ~10 routes of coverage for minimal effort.
2. **Add workspace dashboard E2E** — Each workspace landing page (6 total) should have dedicated content assertions.
3. **Shared Services + Site Control smoke tests** — Highest-value uncovered workspaces.
4. **Project Hub requires project fixture** — Need a `selectProject` fixture for Project Hub E2E.
5. **Target 60% coverage** — Requires covering ~82 routes total. Most efficient path: landing pages + high-value CRUD flows.
