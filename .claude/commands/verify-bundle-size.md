Run bundle-size verification with analyzer outputs, baseline deltas, and budget gating.

## Steps

1. **Analyze SPFx Ship Bundle**
   Run `npm run bundle:ship:analyze`.

2. **Run Stats-Diff Gate**
   Run `npm run verify:bundle-size:warn` for local verification.
   On main-branch CI, run `npm run verify:bundle-size:fail`.

3. **Review Analyzer Outputs**
   Check these files if they exist:
   - `temp/analyze/spfx-bundle-report.html`
   - `temp/analyze/spfx-stats.json`
   - `temp/analyze/spfx-size-report.json`

4. **Report Regressions**
   Compare entrypoint/chunk raw+gzip+brotli sizes against `config/bundle-budget.spfx.json`.
   Include forbidden module matches and static import guard violations.

## Output Format

**Bundle Verification:**
- SPFx analyze build: PASS/FAIL
- Mode: warn/fail
- Entrypoint delta vs baseline: +N% / -N% (raw, gzip, brotli)
- Monitored chunk deltas: `phase-*`, `lib-*`, `vendors`, `runtime`
- Top contributors: top 10 assets and modules
- Violations: forbidden module patterns + static import guard findings
- Recommendation: PASS / WARN / FAIL

Policy:
- Local default: warn-only (`npm run verify:bundle-size`)
- CI pull_request: warn-only
- CI main: fail on regression (`npm run verify:bundle-size:fail`)

If analyze or stats parsing fails, include the first error and likely root cause.
