Post-chunk review: verify code, scan SharePointDataService for real stub counts, and generate updated CLAUDE.md sections.

## Steps

### 1. Run Verification
Run `/verify-changes` first. If it fails, stop and fix issues before continuing.

### 2. Scan SharePointDataService for Ground-Truth Metrics
Scan `packages/hbc-sp-services/src/services/SharePointDataService.ts` and count:
- **Total public async methods**: Count all `public async` method declarations (exclude private/protected helpers like `_getProjectWeb`, `_ensureList`, etc.)
- **Stubs**: Count methods containing `[STUB]` or `throw new Error('Not implemented')` in their body
- **Implemented**: Total minus Stubs
- **Delegation stubs**: Count methods containing `[DELEGATION]` or `Power Automate` delegation comments

### 3. Group Remaining Stubs by Domain
For each stub found, identify its domain based on the nearest section comment (e.g., `// ── Monthly Project Review`, `// ── Turnover`, `// ── Help`). List each domain with its stub count.

### 4. Generate Updated §7 and §15 Content
Output ready-to-paste markdown for CLAUDE.md:

```
## §7 Service Methods Status (Live)

**Total methods**: [scanned total]
**Implemented**: [scanned implemented]
**Delegation stubs**: [count]
**Remaining stubs**: [count]

**Last Completed**:
- SP-[N] ([date]): [domain] — [count] methods
- [previous entries...]

**Remaining Domains ([stub count] stubs)**:
- [Domain] ([count])
- ...

**Next Recommended Chunk**: [smallest remaining domain]
```

```
## §15 Current Phase Status

**Active Phase**: Data Layer Completion (SharePointDataService)
**Goal**: Reach [total]/[total] before any new UI or features are built.

**Recent Progress**:
- SP-[N]: [domain] ([count] methods) → [new total]/[total]
- [previous...]
```

### 5. Check CLAUDE.md Size
Read CLAUDE.md and check its character count:
- Under 30K: "CLAUDE.md size: OK ([size] chars)"
- 30K-35K: "CLAUDE.md size: WARNING — approaching limit ([size] chars). Consider archiving."
- Over 35K: "CLAUDE.md size: CRITICAL — over 35K ([size] chars). Archive old content now."

### 6. Summary
Display a summary table:
```
┌─────────────────────────────────────┐
│ Post-Chunk Review Summary           │
├─────────────────────────────────────┤
│ Verification:    ✅ Passed          │
│ SP Progress:     [impl]/[total] ([%])│
│ Stubs Remaining: [count] in [N] domains│
│ CLAUDE.md Size:  [status]           │
│                                     │
│ §7 and §15 content generated above. │
│ Review and paste into CLAUDE.md.    │
└─────────────────────────────────────┘
```

### 7. Apply Updates
After showing the summary, ask: "Apply these updates to CLAUDE.md §7 and §15 now?"
If yes, update CLAUDE.md with the generated content. Also update the `**Last Updated:**` line and the §4 method counts.
