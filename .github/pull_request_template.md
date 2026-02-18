## Summary

-

## Changes

-

## Test plan

- [ ] Ran `npm run test:ci` — all tests pass
- [ ] Ran `npx tsc --noEmit` — no type errors
- [ ] Ran `npm run lint` — no errors
- [ ] Ran `npm run test:a11y` — zero WCAG 2.2 AA violations
- [ ] Ran standalone RBAC verification (`npm run test --workspace=packages/hbc-sp-services -- StandaloneRbacResolver`)
- [ ] Ran standalone E2E verification (`npm run test:e2e -- playwright/mode-switch.spec.ts playwright/offline-mode.spec.ts playwright/standalone-auth.spec.ts`)
- [ ] Updated `/docs/standalone-mode.md` for any standalone auth/RBAC behavior change
- [ ] Verified in Storybook — Accessibility panel shows 0 violations for affected stories
- [ ] If new components added: included a Storybook story that passes axe scan

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
