# Long-Term Maintenance and Technical Debt Governance

## Purpose and Scope

This document defines the ongoing maintenance process for HBC Project Controls after Stage 9 rollout completion. It is the canonical governance reference for:

- operational maintenance cadence,
- technical debt intake and closure,
- release gate enforcement,
- exception and waiver handling.

Scope covers application-level reliability, performance, smoke-test stability, deployment readiness, and shared-service consumption safeguards.

## Operating Cadence

| Cadence | Activity | Owner Group | Required Evidence |
|---|---|---|---|
| Daily | Smoke triage and telemetry/alert review | QA + Engineering | latest smoke run status + open incident list |
| Weekly | Technical debt grooming + flaky test review | Engineering | updated debt register rows |
| Sprint-end | Release-readiness gate review | Engineering + QA + Release Manager | compile, bundle, smoke, and governance checks |
| Monthly | Bundle/perf trend review and budget posture check | Engineering | `bundle:analyze` + budget report trend |
| Quarterly | Architecture/dependency debt and long-horizon remediation planning | Engineering Leadership | prioritized debt roadmap |

## Governance Roles and Ownership

| Role | Responsibility |
|---|---|
| Engineering | Owns code-quality debt, performance debt, and remediation execution |
| QA | Owns smoke/e2e stability debt and regression triage |
| Operations | Owns deployment readiness and feature-flag posture verification |
| Release Manager | Owns final go/no-go decision and waiver approvals |

## Technical Debt Lifecycle

1. Intake: create a debt register item with owner, severity, target date, and exit criteria.
2. Triage: classify by impact and map to required verification command(s).
3. Plan: assign sprint/quarter target and mitigation approach.
4. Execute: implement remediation with linked changelog evidence.
5. Verify: run objective validation commands and attach outputs.
6. Close: mark item complete only when exit criteria are satisfied.

## Technical Debt Register Template

Use this template for all new debt items:

| Debt ID | Area | Description | Type | Severity | Owner | Opened | Target | Status | Risk if Deferred | Mitigation | Validation Command | Exit Criteria | Linked Stage/Changelog |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DEBT-YYYY-NNN | Routing / Query / Build / E2E / Docs / Security | Concise technical debt statement | Reliability / Performance / Maintainability / Test / Documentation | Critical / High / Medium / Low | Team or person | YYYY-MM-DD | YYYY-MM-DD | Open / In Progress / Blocked / Closed | Concrete operational risk | Planned remediation summary | Exact command(s) | Objective closure signal | Stage entry or changelog link |

## Severity Model and Remediation SLAs

| Severity | Definition | Required SLA |
|---|---|---|
| Critical | Release-blocking or production risk without safe fallback | Resolve in next hotfix window |
| High | Significant reliability/perf risk with manageable workaround | Resolve in current sprint |
| Medium | Moderate risk or recurring maintenance burden | Resolve within 2 sprints |
| Low | Minor debt with low immediate risk | Schedule in planned backlog |

## Ongoing Governance Rules

- No debt item may exist without an owner and explicit exit criteria.
- No release proceeds with unresolved Critical debt unless a signed waiver is active.
- Closed debt items must include objective evidence from validation commands.
- If a debt item reopens, create a new row with linked prior item for traceability.
- Governance reviews must update both debt status and next checkpoint date.

## Release and Rollout Maintenance Gates

| Gate | Deploy Requirement | Validation Command |
|---|---|---|
| Compile Integrity | TypeScript compile must pass on release candidate | `npx tsc --noEmit` |
| Bundle Governance | Bundle analysis available and budget posture reviewed | `npm run bundle:analyze` |
| Budget Enforcement | Entrypoint budget enforcement must pass | `npm run verify:bundle-governance` |
| Standalone Smoke | Core standalone smoke must pass | `npm run test:e2e:standalone-smoke` |
| Teams Smoke | Teams-hosted smoke must pass | `npm run test:e2e:teams-core-smoke` |
| Router Parity | Route parity smoke must pass | `npm run test:e2e:router-parity` |

## Performance Gating Rules - Stage 10 (Infinite Queries & Virtualization)

### Query Page-Size Defaults (Field Device Baseline)

- Use `pageSize: 50` for dense preconstruction datasets with heavier row payloads (for example: estimating/department-tracking style records).
- Use `pageSize: 100` for operations dashboards and checklist/project lists with lighter row payloads.
- Rationale: first payload stays constrained for slower field-device networks while preserving smooth incremental hydration for subsequent pages.

### Virtualization Thresholds, Overscan, and Transition Usage

- Virtualization is mandatory for list/table surfaces once row volume exceeds `200` rendered rows or where infinite pages are enabled.
- Keep virtualization logic centralized in shared table components so row measurement, scroll-container behavior, and overscan tuning remain consistent.
- Default overscan posture should prioritize touch-scroll smoothness while limiting memory growth; start from shared defaults and tune only with measured evidence.
- Wrap filter/search state updates in `React.startTransition` where large row sets are rendered to reduce typing and interaction jank under concurrent rendering.

### Bundle-Size and Memory Monitoring Requirements

- Every release candidate must include bundle posture evidence from `npm run bundle:analyze`.
- Stage 10 large-list validation must include runtime memory snapshots (baseline vs. virtualized/infinite-query state) in React DevTools/Profiler.
- Performance gate requires observed memory reduction target of `>=40%` on representative high-volume construction lists before production rollout.

### Rollback Procedure (Stage 10 Paging/Virtualization)

1. Revert affected list pages to prior full-fetch `useQuery`/`useEffect` data paths for emergency stabilization only.
2. Preserve existing query-key naming to avoid cache contract drift during rollback and forward reapplication.
3. Disable incremental `Load More` UX affordances where full-fetch fallback is active to prevent mixed-mode behavior.
4. Redeploy last known-good package after rollback and rerun compile/smoke gates before re-opening rollout.
5. Create/track a debt item for rollback follow-up and reintroduce Stage 10 behavior only after root-cause remediation is verified.

### Field Usability Notes (Load More + Touch Scrolling)

- Initial list render should prioritize first-page responsiveness; additional pages load on explicit user action (`Load More`) or controlled infinite triggers.
- Touch scrolling must remain smooth under virtualized rendering; avoid auto-fetch-all behavior that negates field-device payload limits.
- Keep `isFetchingNextPage` indicators visible near list controls and expose explicit retry actions on page-fetch errors.
- For intermittent connectivity, preserve already loaded rows and provide recoverable retry flow instead of resetting full list state.

### Deployment Verification Checklist (Stage 10)

| Gate | Requirement | Validation Command |
|---|---|---|
| TypeScript integrity | No compile/type regressions | `npx tsc --noEmit` |
| Bundle analysis | Analyze output generated and reviewed | `npm run bundle:analyze` |
| Large-list smoke | Infinite pagination + virtualization flow is stable | smoke run with high-volume list fixtures/data |
| Runtime safety | RBAC, optimistic updates, telemetry, and client filtering unchanged | targeted operations/preconstruction smoke validation |

## Monitoring and Alert Review Process

- Daily review open alerts/incidents and classify into defect vs. debt.
- Link recurring alerts to debt items instead of tracking in ad hoc notes.
- Escalate unresolved Critical/High alert debt during weekly maintenance review.
- Record accepted operational risk and fallback posture explicitly.

## Exception and Waiver Policy

Waivers are time-boxed and required for unresolved Critical/High debt when release must proceed.

Required waiver fields:

- scope,
- duration,
- fallback/rollback action,
- approver,
- expiration date.

Waivers expire automatically at the recorded date and must be renewed explicitly.

## Recent Changes

- Stage 10 introduced infinite-query pagination and centralized virtualization guardrails as release-gated operational policy.
- Operators should verify first-page behavior before requesting full dataset expansion; use explicit `Load More` paths to manage field-device network/memory constraints.
- During rollout validation, capture evidence for page-fetch latency, scroll smoothness, and memory posture alongside standard compile/bundle/smoke gates.

## Document Review Policy

- Review this document at least once per sprint-end governance checkpoint.
- Update when release gates, command names, or ownership model changes.
- Reference major maintenance-process updates in `CHANGELOG.md`.
