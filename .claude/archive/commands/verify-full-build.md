Run the full production build verification. This is the heavyweight check — use before commits and PRs.

## Steps

1. **TypeScript Compilation**
   Run `npx tsc --noEmit`. Report any type errors.

2. **ESLint**
   Run `npm run lint`. Report errors and warnings.

3. **Unit Tests**
   Run `npm run test:ci`. Report pass/fail and coverage.

4. **Library Build**
   Run `npm run build:lib`. Report success or failure.

5. **Full SPFx Build**
   Run `volta run --node 22.14.0 npm run build:app`. This bundles and packages the SPFx solution. Report success or failure.

## Output Format

Summarize results as:

**Full Build Verification:**
- TypeScript: PASS/FAIL
- ESLint: PASS/FAIL (N errors, N warnings)
- Tests: PASS/FAIL (N passed, N failed, coverage: N%)
- Library Build: PASS/FAIL
- SPFx Build: PASS/FAIL

If any step fails, stop and report the errors with suggested fixes. Do not continue to later steps if an earlier step fails.
