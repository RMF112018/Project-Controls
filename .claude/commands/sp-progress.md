Quick read-only scan of SharePointDataService implementation progress. No file modifications.

## Steps

### 1. Scan SharePointDataService
Read `packages/hbc-sp-services/src/services/SharePointDataService.ts` and count:
- **Total**: All `public async` method declarations (exclude private/protected helpers)
- **Stubs**: Methods containing `[STUB]` or `throw new Error('Not implemented')`
- **Implemented**: Total minus Stubs
- **Delegations**: Methods containing `[DELEGATION]` or Power Automate delegation

### 2. Group Stubs by Domain
For each stub, identify its domain from the nearest section comment. List domains with counts.

### 3. Output Progress Report
Display results in this format:

```
SharePoint Data Service Progress: [implemented]/[total] ([percentage]%)
Remaining: [stub count] stubs in [domain count] domains
- [Domain1] ([count]), [Domain2] ([count]), ...
```

If there are delegation stubs, add:
```
Delegations: [count] methods (Power Automate / external)
```

That's it. No file changes, no documentation updates. Use `/review-chunk` for the full post-chunk workflow.
