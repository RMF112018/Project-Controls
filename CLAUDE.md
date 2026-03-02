# HBC Project Controls – Hot-Memory Constitution
## Version: 1.0 (28 Feb 2026)
Always loaded first in every agent session. This file is the single source of truth for consistency.

### 1. Project Overview (never hallucinate)
- SPFx 1.18+ web part: `HbcProjectControlsWebPart`
- Domain: Unified construction project lifecycle for Hedrick Brothers Construction (Jupiter, FL)
- 14 roles, 70+ granular permissions enforced via `@hbc/sp-services/permissions`
- Feature flags drive every conditional render and API call
- Tech stack (immutable at this commit):
  - React 18 (StrictMode, concurrent features)
  - TanStack Router v1 (file-based routing, loaders/actions)
  - TanStack Query v5 (exact query-key format enforced)
  - Fluent UI v9 (all components, no MUI or Office UI Fabric v8)
  - `@hbc/sp-services` (shared data layer – never duplicate API logic)

### 2. File & Directory Conventions
- All source under `src/webparts/hbcProjectControls/`
- Routes: `src/webparts/hbcProjectControls/routes/`
- Components: `src/webparts/hbcProjectControls/components/` (flat when < 5 files, else feature folders)
- Hooks: `src/webparts/hbcProjectControls/hooks/` (prefix `useHbc*`)
- Services: never import directly – route through `@hbc/sp-services`
- Tests: `__tests__/` sibling to component (Playwright in `playwright/`)
- Docs: only `docs/` for human-readable operational procedures

### 3. Naming & Typing Rules
- React components: PascalCase + `Hbc` prefix when domain-specific (`HbcProjectHeader`)
- Hooks: `useHbcQuery`, `useHbcMutation`, `useHbcFeatureFlag`
- Query keys: array of strings, first element always the domain (`['project', id, 'details']`)
- Permissions: `can(permissionKey)` from `@hbc/sp-services/permissions`
- Feature flags: `useFeatureFlag('flagName')` – never hard-code strings
- Route params: typed with TanStack Router `Route` objects

### 4. Architectural Principles (enforce in every change)
1. Single source of truth = SharePoint list + Graph API via `@hbc/sp-services`
2. All side effects go through TanStack Query mutations
3. Role & permission checks at the route loader level (never in leaf components)
4. Feature flags wrap entire sub-trees
5. React 18 performance: no unnecessary re-renders – use `useMemo`, `useCallback`, `React.memo` aggressively
6. TanStack Router loaders must return `json()` or `redirect()`
7. Error boundaries required for every route subtree
8. Florida compliance (hurricane, permitting) must be explicitly referenced in comments

### 5. Performance & Construction-Industry Requirements
- < 2 s initial load on typical job-site tablet (iPad + cellular)
- All queries must have `staleTime` ≥ 5 min unless user action
- No blocking renders during data fetch – use `Suspense` + skeletons (Fluent UI `Skeleton`)
- 100 % accessible (WCAG 2.2 AA) – every Fluent UI component must carry `aria-*` props

### 6. Checklists (run mentally before every code change)
**Pre-change**
- Does this touch a feature-flagged area? Update flag definition.
- Is a new permission required? Add to `@hbc/sp-services/permissions`
- Does route need loader? Yes → add typed loader.
- Query key collision possible? No → follow exact format.

**Before commit**
- All new components wrapped in `React.memo` where props are stable
- New routes added to `routeTree`
- CHANGELOG.md updated with user-facing impact
- Docs/spec updated if any specification changes
- Docs/ updated if operational procedure changes

### 7. Known Failure Modes & Never-Do Rules
- Never call SharePoint REST directly – always `@hbc/sp-services`
- Never hard-code list GUIDs – use constants from `@hbc/sp-services`
- Never bypass `can()` permission check
- Never use `useEffect` for data fetching
- Never commit with `console.log` or `debugger`
- Never ignore TypeScript errors
- Never use `any` type (except legacy SPFx props)

### 8. Trigger Table (routing to specialist agents)
| File pattern / Task keywords                                                                | Required specialist agent                  |
|---------------------------------------------------------------------------------------------|--------------------------------------------|
| `@hbc/sp-services`, SharePoint, pnp/sp, data service, Graph API, service layer, REST bypass | `sp-services-guardian`                     |
| `useHbcQuery`, `useHbcMutation`, query key, invalidation, TanStack Query v5                 | `tanstack-query-specialist`                |
| `routes/`, routeTree.tsx, loader, action, TanStack Router                                   | `tanstack-router-specialist`               |
| `components/` + Fluent UI, Combobox, Dropdown, Button, Theme, Fluent UI v9                  | `fluent-ui-v9-specialist`                  |
| Role, permission, `can()`, feature flag, loader check                                       | `permissions-feature-flag-engineer`        |
| Performance, React.memo, useMemo, useCallback, Suspense, TTI                                | `react-18-performance-engineer`            |
| Construction domain, CPM, EVMS, RFI, change order, Florida compliance                       | `construction-domain-specialist`           |
| Estimating, takeoff, CSI, RSMeans, bid, assembly, markup, ProEst, STACK                     | `construction-estimating-specialist`       |
| Coordinate, isometric, camera transform, virtual framebuffer, mouse picking                 | `coordinate-wizard`                        |
| Create agent, new specialist, AGENT.md, agent factory                                       | `factory-agent`                            |

When a task matches any pattern above, invoke the specialist first and paste this constitution.

### 9. Build & Dev Commands (exact)
```bash
npm install
npm start                  # SPFx workbench
npm run build
gulp bundle --ship
gulp package-solution --ship
```

### 10. Session Hygiene Rules
- If something is explained or corrected twice → add it here immediately.
- After any change, ask the relevant specialist at .claude/agents/ to review and propose updates to this constitution.
- Weekly drift review: run full codebase scan against this file.
- Never create, reference, or modify any repository-level context files except this CLAUDE.md.

### 11. MCP Retrieval Protocol (mandatory for all sessions)

- Keep the MCP server running in a separate terminal:
- cd tools/mcp-retrieval-server && uvicorn server:app --port 8001 --reload
- Before any domain, routing, performance, or complex change, first call:
- curl -X POST "http://localhost:8001/find_relevant_context" \
  -H "Content-Type: application/json" \
  -d '{"query": "exact task description here", "top_k": 3}'
- Paste the full JSON response (including filenames, relevance scores, and snippets) into your reasoning.
- Always prefer and quote the highest-relevance spec returned.
- If no specs match (score < 0.1), state this clearly and ask for clarification before proceeding.

End of Constitution