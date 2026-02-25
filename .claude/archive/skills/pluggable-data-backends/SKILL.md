---
name: Pluggable Data Backends
description: DataProviderFactory pattern enabling seamless runtime switching between SharePoint, Azure SQL, and Dataverse without touching UI or business logic
version: 1.0
category: data
triggers: data provider factory, pluggable backend, Azure SQL, Dataverse, IDataService, backend adapter, Gen 2 desktop, Gen 3 mobile
updated: 2026-02-22
---

# Pluggable Data Backends Skill

**Activation**  
Any work on data layer, IDataService implementations, backend adapters, or future Gen 2/3 readiness.

**Protocol**  
1. All features talk exclusively to `IDataService` interface (250 methods).  
2. `DataProviderFactory` reads runtime config (env + SharePoint list) and returns the active implementation.  
3. Empty adapter skeletons (`AzureSqlDataService`, `DataverseDataService`) are created with full interface compliance (throw NotImplemented for Phase 0.5).  
4. Factory is injected once at app root and remains stable.  
5. All TanStack Query keys are domain-prefixed and backend-agnostic.  
6. Post-change verification: run standalone mode tests for all three backends, update CLAUDE.md §19.

**6 Critical Flows Guaranteed Stable**  
1. Default SharePoint backend – zero change to existing functionality.  
2. Config toggle to Azure SQL – all queries resolve transparently.  
3. Config toggle to Dataverse – same.  
4. Future desktop (Gen 2) – reuse same factory with different config.  
5. Mobile (Gen 3) – same factory.  
6. Audit logging and error handling remain identical across backends.

**Manual Test Steps**  
1. Run in mock mode → confirm all features work.  
2. Switch config to standalone SharePoint → verify same results.  
3. (Future) Switch to Azure SQL skeleton → confirm graceful fallback.  
4. Add new service method → verify it works on all backends via factory.  
5. Run full E2E suite in each mode.  
6. Verify no UI code imports any concrete backend.

**Reference**  
- `CLAUDE.md` §19 (Pluggable Backend Strategy), §0a  
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` (Deliverable #3)  
- `DATA_LAYER_GUIDE.md` §2 (IDataService)  
- Master plan cross-reference: Phase 0.5