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

## Document Review Policy

- Review this document at least once per sprint-end governance checkpoint.
- Update when release gates, command names, or ownership model changes.
- Reference major maintenance-process updates in `CHANGELOG.md`.
