---
name: SECURITY_PERMISSIONS_GUIDE | description: RBAC, RoleGate, FeatureGate, and compliance patterns | triggers: security,permission,role,feature,guard,rbac | updated: 2026-02-21
---
# HBC SECURITY & PERMISSIONS GUIDE (Lean v1)
Token limit: < 8 kB | Use with FEATURE_DEVELOPMENT_BLUEPRINT.md

## §0 Core Principles
- 14 roles, 70+ granular permissions enforced at every surface
- RoleGate + FeatureGate wrappers required before any sensitive render
- All mutations audited via AuditService
- Compliance with construction-industry data segregation

## §1 Enforcement Patterns
- Permission checks in TanStack Router guards
- Guards receive dynamic values (`isFeatureEnabled`, `currentUser`) via `router.update()` context injection — never via router recreation (see `tanstack-router-stability-spfx` skill)
- Feature flags for phased rollouts (e.g., schedule-v2)
- GraphService for cross-tenant identity

## §2 Agent Checklist (for every new page or action)
- [ ] RoleGate/FeatureGate applied?
- [ ] New permission added to PermissionStrategy?
- [ ] Audit log entry included?
- [ ] SECURITY_ANALYSIS.md in docs/ updated?

Reference files only. Never repeat full sections.