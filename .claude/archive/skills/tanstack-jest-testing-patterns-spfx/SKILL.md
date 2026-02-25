---
name: TanStack Jest Testing Patterns SPFx
description: Production-grade Jest + RTL + TanStack Query/Router v1 testing patterns (renderWithProviders, optimistic mutations, guarded routes, permission matrix) for SPFx web parts
version: 1.1
category: testing
triggers: renderWithProviders, tanstack query test, router test, optimistic mutation, permission matrix, role fixtures, renderHookWithRouter, TanStack Table test, SignalR invalidation test, dual-path parity, mutation-killing, boundary testing
updated: 2026-02-25
---

# TanStack Jest Testing Patterns SPFx Skill

**Activation**  
Implementing or reviewing unit/integration tests for any TanStack Router v1, TanStack Query, or TanStack Table surface, including components, hooks, loaders, guards, mutations, or tables.

**Protocol**  
1. **Provider setup**: Always use/extend `renderWithProviders` (with RouterProvider, QueryClient, RoleSwitcher, MockDataService).  
2. **Query & mutation testing**: Use `@tanstack/react-query` test utilities; test optimistic updates, rollback, SignalR invalidations, error boundaries, and suspense states exactly as defined in §16.  
3. **Router testing**: Test guards, loaders, lazy routes, `useAppNavigate`/`useAppLocation` stability; wrap navigations in `startTransition`.  
4. **Permission matrix**: Exhaustively test every relevant combination from the 14-role / 70+ permission matrix using fixtures from PERMISSION_STRATEGY.md.  
5. **Table & virtualization**: Test column defs, role-based cell visibility, sorting/filtering, and virtualization with TanStack Table variants.  
6. **Post-change verification**: Run targeted coverage, full `npm run test:ci`, and update CLAUDE.md §15.

**6 Critical Flows Guaranteed Stable**  
1. **Optimistic mutation** – create/update with rollback on error, SignalR invalidation.  
2. **Router guard** – permission/feature-flag re-evaluation without recreation or freeze.  
3. **RenderWithProviders** – stable context for all TanStack + role + flag combinations.  
4. **Lazy route** – loader + suspense coverage remains >91%.  
5. **Role-based rendering** – conditional UI (table cells, modals) 100% branch covered.  
6. **Hook stability** – `renderHookWithRouter` returns memo-stable results.

**Manual Test Steps**  
1. Add new mutation test → run coverage on file → confirm 100%.  
2. Switch role in test → confirm guard and UI re-render correctly.  
3. Trigger error path → confirm rollback and UI feedback.  
4. Navigate lazy route in test → confirm no remount or blank screen.  
5. Run full component Jest project → confirm no CI regression.  
6. Review Storybook + a11y → confirm no new violations.

**Phase 7S4 Additions (v1.1)**
- **Dual-path parity pattern**: Test ROLE_PERMISSIONS (legacy fallback) vs PermissionEngine (TOOL_DEFINITIONS + permissionTemplates.json) consistency. Engine path is superset of legacy. Known gaps baselined as regression guards. See `permissions.dualpath.test.ts`.
- **Mutation-killing techniques**: Target exact boundary values (timing windows, queue depths, threshold counts), format assertions (token regex, progress percentage), ordering invariants (compensation reverse order), and shape enforcement (result properties). See `ProvisioningSaga.mutation.test.ts`, `GraphBatchEnforcer.mutation.test.ts`.
- **Coverage gap edge cases**: Test inactive configs, empty configs, unknown roles, deduplication, mixed paths. See `permissions.coverage.test.ts`.

**Reference**
- CLAUDE.md §15 (Test Architecture) & §16 (Optimistic contracts)
- tanstack-router-stability-spfx skill (complementary router singleton)
- renderWithProviders implementation and existing Prompt 4 test patterns
- PERMISSION_STRATEGY.md