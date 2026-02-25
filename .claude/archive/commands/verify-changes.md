Run the standard verification suite for the current code changes. Execute each step sequentially and report results clearly.

## Steps

1. **TypeScript Compilation**
   Run `npx tsc --noEmit` from the project root. Report any type errors with file paths and line numbers.

2. **ESLint**
   Run `npm run lint`. Report any lint errors or warnings. If there are auto-fixable issues, mention that `npm run lint:fix` can resolve them but do NOT run it automatically.

3. **Unit Tests**
   Run `npm run test:ci`. Report the test results including pass/fail counts and coverage summary.

## Output Format

Summarize results as:

**Verification Results:**
- TypeScript: PASS/FAIL (N errors)
- ESLint: PASS/FAIL (N errors, N warnings)
- Tests: PASS/FAIL (N passed, N failed, coverage: N%)

If any step fails, list the specific errors and suggest fixes.
