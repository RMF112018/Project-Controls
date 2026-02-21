---
name: TESTING_STRATEGY | description: Comprehensive testing approach for SPFx/React construction platform | triggers: test,testing,jest,playwright,rtl,coverage,a11y | updated: 2026-02-21
---
# HBC TESTING STRATEGY (Lean v1)
Token limit: < 8 kB | Use with PERFORMANCE_OPTIMIZATION_GUIDE.md

## §0 Testing Pyramid (Enforced)
- Unit (Jest + RTL): 70 %
- Component/integration: 20 %
- E2E (Playwright): 10 %
- Accessibility (axe): 100 % of new surfaces

## §1 Tool-Specific Rules
- Jest: `jest.config.js` + `jest.config.components.js`; target 85 % coverage on src/
- React Testing Library: user-event, screen queries only; no shallow renders
- Playwright: `playwright.config.ts`; focus on critical workflows (Go/No-Go, buyout log, closeout)
- Storybook + Chromatic for visual regression on shared components

## §2 Agent Checklist (run before any PR)
- [ ] Unit tests added/updated for new hooks or business logic?
- [ ] E2E for new route or workflow?
- [ ] Accessibility test (npm run test:a11y) passes?
- [ ] Coverage report reviewed and regressions prevented?

## §3 Verification Commands
```bash
npm run test:ci
npm run test:e2e
npm run test:a11y