---
name: HBC Permission System
description: Configuration-driven RBAC engine with 6 core roles, global vs scoped access patterns, Entra ID group sync, and SOC2 audit logging for the HBC Project Controls suite
version: 1.1
category: permissions
triggers: role, permission, RBAC, RoleGate, FeatureGate, Admin role screen, global vs scoped, Entra ID, SOC2 audit, permission matrix, role creation, escalation-prevention, rate-limiting, assertNotSelfEscalation, checkRateLimit, PermissionEscalationError
updated: 2026-02-24
---

# HBC Permission System Skill

**Activation**  
Implementing, modifying, or debugging any role-based access, permission checks, RoleGate/FeatureGate components, Admin role/permission UI, Entra ID sync, or SOC2 audit logging.

**Protocol**  
1. All roles and granular permissions are stored in a SharePoint list (configuration-driven – no code changes for new roles).  
2. Admin screen provides create/edit UI for roles and default permission sets (zero-code).  
3. Global vs Scoped flag is first-class on every permission (Leadership = global; Project Executive = assigned projects/departments only).  
4. Entra ID group membership is synced on login and on every permission change.  
5. Every mutation (assign role, change permission, create role) calls `logAudit()` with full before/after snapshot.  
6. RoleGate and FeatureGate components read from the live permission engine (cached via TanStack Query with 60s staleTime).  
7. Post-change verification: Run `npm run test:a11y`, update CLAUDE.md §5, and verify against master plan `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

**6 Critical Flows Guaranteed Stable**  
1. Role creation in Admin screen – instantly available to all users without page refresh.  
2. Global vs Scoped evaluation – Leadership sees everything; Project Executive sees only assigned projects/departments.  
3. Entra ID sync on login – permissions resolved in <300 ms.  
4. Audit log on every change – immutable record with actor, timestamp, before/after.  
5. RoleGate re-evaluation on project switch – uses primitive `userRoles` array (stable reference).  
6. Permission defaults for new roles – Admin can set once and apply to all future users of that role.

**Manual Test Steps**  
1. Log in as Admin → open Role Management screen → create new test role → assign granular permissions → verify new role appears for other users immediately.  
2. Switch to Leadership role → confirm access to all projects/departments.  
3. Switch to Project Executive role → confirm only assigned projects/departments are visible.  
4. Change a permission → verify audit log entry is created with full details.  
5. Remove a role from a user → verify RoleGate blocks access instantly.  
6. Run full E2E suite for all 6 roles.

**Reference**  
- `CLAUDE.md` §5 (Roles & Permissions Matrix), §18 (Roadmap Phase 2)  
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` (Deliverable #5)  
- `SECURITY_PERMISSIONS_GUIDE.md` §1 (RBAC engine)  
- Master plan cross-reference: Phase 2