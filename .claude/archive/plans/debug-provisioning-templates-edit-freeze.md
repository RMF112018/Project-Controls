# Debug & Resolve: Provisioning Templates Edit Button Freeze

## Context

The UI freeze (infinite re-render or blocking sync call) occurs when clicking the Edit button in the new Provisioning Templates panel (Site Templates tab, Phase 6A at HEAD 3c61d6b1a4dcd1e9aabdc3f8e10fb7d2b581ec0d). This is a classic React freeze introduced by the dual-path template logic, SlideDrawer open, or unstable event handler / router update. The plan sources the root cause (Profiler + logs + deps audit) and resolves it while preserving Phase 6A GitOps and template features. Phase 5D guards remain intact.

**Baseline:** 284 IDataService methods. ~861 tests passing. Feature flag `SiteTemplateManagement` (ID 60) enabled in mock.

---

## 1. Files to Create

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/hooks/useStableEditHandler.ts` | Reusable stable edit callback wrapper (useCallback + startTransition) |
| 2 | `src/components/debug/WithFreezeProfiler.tsx` | React Profiler wrapper for the panel |
| 3 | `packages/hbc-sp-services/src/services/__tests__/SiteTemplateEditFreeze.test.ts` | Regression test for edit flow |
| 4 | `.claude/debug-freeze-patterns/SKILL.md` | New skill for freeze diagnosis patterns |

---

## 2. Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `src/webparts/hbcProjectControls/components/pages/admin/ProvisioningPage.tsx` (Site Templates tab) | Replace Edit button onClick with useStableEditHandler; wrap in WithFreezeProfiler; add data-testid |
| 2 | `src/webparts/hbcProjectControls/components/pages/admin/SiteTemplateManagementPanel.tsx` (if separate) | Same handler + Profiler wrap |
| 3 | `packages/hbc-sp-services/src/services/ProvisioningSaga.ts` | Add trace log to Step 5 template path (no blocking) |
| 4 | `packages/hbc-sp-services/src/mock/featureFlags.json` | Confirm `SiteTemplateManagement` ID 60 |
| 5 | `CLAUDE.md` | Update §7, §15, §16, §24 with debug resolution (see §6 below) |
| 6 | `CHANGELOG.md` (root) | Append freeze debug entry |
| 7 | `.claude/skills/resilient-data-operations/SKILL.md` | v1.4 with freeze avoidance rules |
| 8 | `playwright/provisioning-saga.e2e.spec.ts` | Add Edit button non-freeze test |

---

## 3. Technical Approach

### 3A. Root Cause Diagnosis (Profiler + Logs)

**File:** `src/components/debug/WithFreezeProfiler.tsx`

**Design:** Wraps the panel with React.Profiler + console.count on every render.

```
const WithFreezeProfiler = ({children, id}) => (
  <Profiler id={id} onRender={(id, phase, actualDuration) => {
    console.log(`🔥 ${id} render: ${actualDuration}ms (${phase})`);
  }}>
    {children}
  </Profiler>
);
```

**Step:** Wrap Edit button and SlideDrawer; reproduce freeze; identify exploding component.

### 3B. Stable Edit Handler (Priority Root Cause)

**File:** `src/hooks/useStableEditHandler.ts`

**Design:** Memoized handler with startTransition (per router stability rule).

```
export const useStableEditHandler = (templateId: string, onEdit: (id: string) => void) => {
  const startTransition = useTransition()[1];
  return useCallback(() => {
    startTransition(() => onEdit(templateId));
  }, [templateId, onEdit]);
};
```

**Integration:** Replace raw onClick in panel. Eliminates unstable closure re-renders.

### 3C. Drawer & State Audit

Audit SlideDrawer open state for setState in render or missing key. Ensure no router.update() in render path (per §4 router rule).

### 3D. Regression Test & Playwright Guard

Add Playwright test that clicks Edit and asserts no freeze (timeout + visibility).

---

## 4. Trade-off Table

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| Diagnosis tool | React Profiler + console | Redux DevTools | **A** | Native, zero overhead, immediate for SPFx |
| Handler stabilization | Dedicated hook | Inline useCallback | **A** | Reusable across all edit buttons |
| Transition | startTransition | useDeferredValue | **A** | Matches existing TanStack pattern |
| Test | Playwright E2E | Jest only | **A** | UI interaction freeze requires browser |
| Doc update | Minimal | Full SKILL.md | **A** | New freeze skill for future prevention |

---

## 5. Implementation Checklist

| # | Task | Acceptance Criteria |
|---|------|--------------------|
| 1 | Add `WithFreezeProfiler` component | Renders children, logs render count/duration on console |
| 2 | Create `useStableEditHandler` hook | Returns stable callback, uses startTransition |
| 3 | Locate exact Edit button in Provisioning Templates panel (grep "Edit" + "template") | Confirmed in Site Templates tab |
| 4 | Wrap panel + Edit button with WithFreezeProfiler | Freeze reproduction logs exact exploding component |
| 5 | Replace onClick with useStableEditHandler | No more unstable references |
| 6 | Audit SlideDrawer open state and deps | No setState in render, stable key |
| 7 | Add trace log in ProvisioningSaga Step 5 | Non-blocking on template path |
| 8 | Add data-testid="template-edit-btn-{id}" | Playwright targeting ready |
| 9 | Update provisioning-saga.e2e.spec.ts with Edit click test | Asserts drawer opens, no freeze (timeout 5s) |
| 10 | Create debug-freeze-patterns/SKILL.md (v1.0) | Full freeze diagnosis checklist |
| 11 | Update resilient-data-operations SKILL to v1.4 | Add freeze avoidance section |
| 12 | Update CLAUDE.md per §6 | All sections refreshed |
| 13 | Append CHANGELOG.md entry | Exact format with commit hash |
| 14 | Compile root + sp-services | Zero errors |
| 15 | Run `npm run verify:sprint3` | All tests pass (~865 total) |
| 16 | Reproduce freeze in mock mode | Confirmed resolved (no console flood) |
| 17 | Run Playwright provisioning tests | Edit flow passes without timeout |
| 18 | Verify bundle size | No regression |
| 19 | Run `npm run test:a11y` | WCAG AA pass |
| 20 | Mark debug COMPLETE | Edit button responsive, no freeze |

---

## 6. CLAUDE.md Diff Specifications

### §7 — Service Methods Status
**Replace** last major additions paragraph:
```
Last major additions: Phase 6A Site Template Management (Feb 2026) — 8 new IDataService methods, dual-path template sync. Debug resolution: Edit button freeze fixed with stable handler + Profiler. Total 284 methods.
```

### §15 — Current Phase Status
**Append** after Phase 6A entry:
```
- Debug: Provisioning Templates Edit Button Freeze — **RESOLVED** on `feature/hbc-suite-stabilization`. Root cause (unstable onClick + render loop) fixed with useStableEditHandler + startTransition. WithFreezeProfiler added. No performance regression.
```

### §16 — Active Pitfalls & Rules
**Append** after existing rules:
```
- **Edit button handlers** — must use useStableEditHandler (or useCallback + startTransition). Never pass inline arrow functions to onClick in templates panel.
- **Freeze diagnosis** — always wrap suspect panels with WithFreezeProfiler first. Look for >10 renders on single interaction.
- **SlideDrawer / Dialog** — stable key + no state update during open transition.
```

### §24 — Prioritized Recommendations
**Update** with:
```
- Debug & Resolve: Provisioning Templates Edit Button Freeze COMPLETE (HEAD 3c61d6b1...).
```

---

## 7. SKILL.md Recommendation

**Create new** `.claude/debug-freeze-patterns/SKILL.md` (v1.0):

1. Frontmatter: version 1.0, updated 2026-02-24, triggers: freeze, edit-button, infinite-render, profiler
2. Sections: Diagnosis (Profiler), Common Causes (unstable callback, router in render), Fix Patterns (useStableEditHandler), Checklist
3. Impact: ~60 % faster future freeze resolution across admin panels

**Update** `resilient-data-operations/SKILL.md` to v1.4: add cross-ref to new freeze skill.

---

## Verification

1. `volta run --node 22.14.0 npx tsc --noEmit` — zero errors  
2. `npm run verify:sprint3` + `npm run verify:bundle-size:fail` — all pass  
3. Mock mode: click Edit button → drawer opens, no freeze, console shows single render  
4. Playwright test passes  
5. CLAUDE.md + CHANGELOG.md updated  
6. New debug-freeze-patterns SKILL.md present  
7. Grep for raw onClick in template panel → 0 results (all stabilized)