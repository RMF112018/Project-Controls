Perform a UI feedback check on the running dev server.

## Prerequisites
- Dev server must be running (`npm run dev` → http://localhost:3000)
- If using browser automation MCP tools (Puppeteer, Playwright, etc.), those must be configured

## Steps

1. **Verify dev server is running**
   - Check if http://localhost:3000 is responding
   - If not, remind the user to start it with `npm run dev`

2. **Check for build/console errors**
   - Review the dev server terminal output for TypeScript or webpack errors
   - If browser tools available: open the page and check for console errors

3. **Role-based navigation** (if a specific role or page was requested)
   - Navigate to http://localhost:3000
   - Use the RoleSwitcher (bottom-left corner in dev mode) to switch to the requested role
   - Navigate to the requested route
   - Verify the page renders without errors

4. **Visual verification** (if browser automation available)
   - Take a screenshot of the current page state
   - Check that key UI elements are present (headers, tables, buttons, panels)
   - Verify responsive layout if relevant (mobile/tablet breakpoints)

5. **Assertions** (if specific checks were requested)
   - Verify requested elements are visible/hidden based on role
   - Check that data loads in tables/cards
   - Confirm navigation links resolve correctly
   - Verify RBAC gating (certain roles should NOT see certain elements)

## Common Checks
| Check | How |
|-------|-----|
| Page loads without error | No error boundary or blank screen |
| Data table has rows | Table body contains `<tr>` elements |
| RBAC gate works | Switch roles and verify visibility changes |
| Panel opens/closes | Click trigger button, verify panel renders |
| Form validation | Submit empty form, verify error messages appear |
| Navigation works | Click nav items, verify route changes and content loads |

## Output Format
Report findings as:
- **Pass**: What worked correctly
- **Fail**: What broke, with details
- **Screenshot**: Description or path if captured
- **Console errors**: Any JS errors found

## Notes
- This command complements `/verify-changes` (which checks TypeScript/ESLint/tests)
- Use this for visual/UX verification that automated checks cannot catch
- The RoleSwitcher is only visible in dev mode (not production)
- Key roles to test: BD Representative, Estimating Coordinator, Project Manager, Executive Leadership, Department Director
