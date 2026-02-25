---
name: DATA_LAYER_GUIDE | description: Patterns for IDataService, caching, mocks, and PnP integration | triggers: data,service,idataservice,mock,cache,pnp,query | updated: 2026-02-21
---
# HBC DATA LAYER GUIDE (Lean v1)
Token limit: < 8 kB | Use with FEATURE_DEVELOPMENT_BLUEPRINT.md

## §0 Core Principles
- All data access through IDataService interface
- @hbc/sp-services package is the single source of truth
- MockDataService must mirror SharePointDataService exactly
- Caching via CacheService + buildCacheKeySuffix

## §1 Required Patterns
- New methods added to both Mock and SharePoint implementations
- Column mappings in models/ for TanStack Table compatibility
- QueryOptions factories exported for TanStack Query
- PnP batching and GraphService used for cross-site calls

## §2 Agent Checklist (for any data change)
- [ ] Method added to IDataService + both impls?
- [ ] Mock JSON updated in packages/hbc-sp-services/mock/ ?
- [ ] Cache key stable and documented?
- [ ] verify:sprint3 passes?

## §3 Verification Commands
```bash
npm run build:services
npm run test:services