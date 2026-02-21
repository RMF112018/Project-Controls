---
name: Schedule Data Layer & Offline Deployment
description: IDataService extensions, reconciliation, Dexie.js LocalDataService, mutation queue, and Tauri dual deployment
version: 1.0
category: schedule
triggers: idataservice schedule, reconcileScheduleImport, dexie, localdataservice, tauri, offline queue, dual deployment
updated: 2026-02-21
---

# Schedule Data Layer & Offline Deployment Skill

**Activation**  
New schedule methods, reconciliation, offline sync, or Tauri work.

**Strict Workflow**  
1. Extend `IDataService` + both impls.  
2. Implement `reconcileScheduleImport` + `queueOfflineMutation`.  
3. Add Dexie schema and `LocalDataService`.  
4. Wire feature flag `scheduleV2FieldMode`.  
5. Update `CLAUDE.md` §7 & §15.

Reference: `DATA_LAYER_GUIDE.md` and `FEATURE_DEVELOPMENT_BLUEPRINT.md`.