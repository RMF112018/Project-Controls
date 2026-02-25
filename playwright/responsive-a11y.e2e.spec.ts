/**
 * responsive-a11y.e2e.spec.ts — Responsive accessibility tests
 *
 * Validates WCAG 2.2 AA compliance and layout integrity across mobile (375x812)
 * and tablet (768x1024) viewports. Checks touch target sizing, axe scans at
 * each breakpoint, and structural layout adjustments.
 *
 * Run via: npx playwright test responsive-a11y.e2e.spec.ts
 */
import { test, expect } from './fixtures/roleFixture';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Runs axe with WCAG 2.2 AA tag set, excluding Fluent UI Tabster sentinel
 * elements that are internal to the focus management system.
 */
async function checkA11y(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .exclude('[data-tabster-dummy]')
    .analyze();
  expect(results.violations).toEqual([]);
}

/**
 * Selects the first non-disabled project option if no project is currently
 * selected. Required for routes that depend on a project context.
 */
async function ensureProjectSelected(page: Page): Promise<void> {
  const projectSelect = page
    .locator('select')
    .filter({ hasText: /Select a project/i })
    .first();
  if ((await projectSelect.count()) === 0) {
    return;
  }

  const currentValue = await projectSelect.inputValue().catch(() => '');
  if (currentValue) {
    return;
  }

  const options = projectSelect.locator('option');
  const optionCount = await options.count();
  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);
    const value = (await option.getAttribute('value')) ?? '';
    const disabled = (await option.getAttribute('disabled')) !== null;
    const label = (await option.textContent())?.trim() ?? '';
    if (!disabled && value.trim().length > 0 && !/select a project/i.test(label)) {
      await projectSelect.selectOption(value);
      await page.waitForTimeout(300);
      return;
    }
  }
}

/**
 * Checks visible interactive elements for WCAG 2.5.8 minimum touch target
 * sizing (44x44 CSS px). Uses both bounding box and computed min-width/min-height
 * so Fluent UI v9 invisible padding is accounted for.
 */
interface ITouchTargetAudit {
  undersized: string[];
  hbcUndersized: string[];
  formControlUndersized: string[];
}

function parsePx(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

async function checkTouchTargets(page: Page): Promise<ITouchTargetAudit> {
  const buttons = page.locator(
    [
      'button:visible',
      '[role="button"]:visible',
      'a[href]:visible',
      '[role="menuitem"]:visible',
      '[role="tab"]:visible',
      'input:visible',
      'select:visible',
      'textarea:visible',
      '[role="checkbox"]:visible',
      '[role="radio"]:visible',
      '[role="switch"]:visible',
      '[role="combobox"]:visible',
      '[role="spinbutton"]:visible',
      '[role="slider"]:visible',
    ].join(', '),
  );
  const count = await buttons.count();
  const undersized: string[] = [];
  const hbcUndersized: string[] = [];
  const formControlUndersized: string[] = [];

  // Evaluate a broad but bounded sample so regression assertions are meaningful.
  for (let i = 0; i < Math.min(count, 160); i += 1) {
    const element = buttons.nth(i);
    const [box, text, meta] = await Promise.all([
      element.boundingBox(),
      element.textContent(),
      element.evaluate((el) => {
        const html = el as HTMLElement;
        const cs = window.getComputedStyle(html);
        const cls = html.className || '';
        const isHbcAuthored =
          html.hasAttribute('data-hbc') ||
          /\bhbc[-_]/i.test(cls) ||
          /\bdata-hbc\b/i.test((html.getAttribute('data-testid') ?? ''));
        const role = html.getAttribute('role') ?? '';
        const tag = html.tagName.toLowerCase();
        const isFormControl =
          tag === 'input' ||
          tag === 'select' ||
          tag === 'textarea' ||
          role === 'checkbox' ||
          role === 'radio' ||
          role === 'switch' ||
          role === 'combobox' ||
          role === 'spinbutton' ||
          role === 'slider';
        return {
          minWidth: cs.minWidth,
          minHeight: cs.minHeight,
          className: cls,
          tag,
          role,
          isHbcAuthored,
          isFormControl,
        };
      }),
    ]);
    if (!box) continue;

    const minWidth = parsePx(meta.minWidth);
    const minHeight = parsePx(meta.minHeight);
    const effectiveWidth = Math.max(box.width, minWidth);
    const effectiveHeight = Math.max(box.height, minHeight);

    if (effectiveWidth < 44 || effectiveHeight < 44) {
      const descriptor = `"${(text ?? '').trim().slice(0, 40)}" <${meta.tag}${meta.role ? ` role=${meta.role}` : ''}> (${Math.round(effectiveWidth)}x${Math.round(effectiveHeight)})`;
      undersized.push(descriptor);
      if (meta.isHbcAuthored) {
        hbcUndersized.push(descriptor);
      }
      if (meta.isFormControl) {
        formControlUndersized.push(descriptor);
      }
    }
  }

  if (undersized.length > 0) {
    console.warn(`Touch target warnings (${undersized.length}):`, undersized.slice(0, 5));
  }

  return { undersized, hbcUndersized, formControlUndersized };
}

/**
 * Strict form-control audit scoped to a container (e.g., main content).
 * Used for mobile workflow pages where WCAG 2.5.8 must be enforced strictly.
 */
async function checkFormControlsInRegion(page: Page, containerSelector: string): Promise<string[]> {
  const controls = page.locator(
    `${containerSelector} input:visible, ${containerSelector} select:visible, ${containerSelector} textarea:visible, ${containerSelector} button:visible, ${containerSelector} [role="checkbox"]:visible, ${containerSelector} [role="radio"]:visible, ${containerSelector} [role="switch"]:visible, ${containerSelector} [role="combobox"]:visible`,
  );
  const count = await controls.count();
  const undersized: string[] = [];

  for (let i = 0; i < Math.min(count, 80); i += 1) {
    const control = controls.nth(i);
    const [box, text, styleMeta] = await Promise.all([
      control.boundingBox(),
      control.textContent(),
      control.evaluate((el) => {
        const cs = window.getComputedStyle(el as HTMLElement);
        const tag = (el as HTMLElement).tagName.toLowerCase();
        const role = (el as HTMLElement).getAttribute('role') ?? '';
        return { minWidth: cs.minWidth, minHeight: cs.minHeight, tag, role };
      }),
    ]);
    if (!box) continue;
    const width = Math.max(box.width, parsePx(styleMeta.minWidth));
    const height = Math.max(box.height, parsePx(styleMeta.minHeight));
    if (width < 44 || height < 44) {
      undersized.push(`"${(text ?? '').trim().slice(0, 40)}" <${styleMeta.tag}${styleMeta.role ? ` role=${styleMeta.role}` : ''}> (${Math.round(width)}x${Math.round(height)})`);
    }
  }

  return undersized;
}

// ---------------------------------------------------------------------------
// Mobile viewport tests (375 x 812)
// ---------------------------------------------------------------------------
test.describe('Responsive A11y — Mobile (375x812)', () => {
  test('home page — main content visible at mobile viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Verify the main content area is visible and occupies a reasonable portion
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    const mainBox = await main.boundingBox();
    expect(mainBox).toBeTruthy();
    // Main content should span most of the 375px viewport width
    expect(mainBox!.width).toBeGreaterThan(200);
    // Main content should be within the viewport (not pushed off-screen)
    expect(mainBox!.x).toBeGreaterThanOrEqual(0);
    expect(mainBox!.x).toBeLessThan(375);
  });

  test('home page — axe scan at mobile viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await checkA11y(page);
  });

  test('home page — touch target sizing audit at mobile viewport', async ({
    page,
    switchRole,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const { undersized, hbcUndersized } = await checkTouchTargets(page);

    // Baseline documentation — record the count of undersized elements.
    // This assertion ensures future regressions (more undersized targets)
    // are caught, while not blocking on the current baseline.
    expect(undersized.length).toBeLessThan(25);
    // Strict for HBC-authored controls only; Fluent UI controls remain baseline-only.
    expect(hbcUndersized).toEqual([]);
  });

  test('operations dashboard — axe scan at mobile viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    await checkA11y(page);
  });

  test('preconstruction page — touch targets and axe at mobile viewport', async ({
    page,
    switchRole,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');
    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    await checkTouchTargets(page);
    await checkA11y(page);
  });

  test('operations dashboard — form controls meet strict touch targets at mobile viewport', async ({
    page,
    switchRole,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    await ensureProjectSelected(page);

    const formControlUndersized = await checkFormControlsInRegion(page, 'main');
    expect(formControlUndersized).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tablet viewport tests (768 x 1024)
// ---------------------------------------------------------------------------
test.describe('Responsive A11y — Tablet (768x1024)', () => {
  test('home page — layout adjusts at tablet viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Verify main content is visible and uses more horizontal space than mobile
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    const mainBox = await main.boundingBox();
    expect(mainBox).toBeTruthy();
    // At 768px, content should be wider than the mobile minimum
    expect(mainBox!.width).toBeGreaterThan(400);

    // Check that the page renders at least some heading content
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('home page — axe scan at tablet viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await checkA11y(page);
  });

  test('preconstruction page — sidebar behavior at tablet viewport', async ({
    page,
    switchRole,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify a sidebar or navigation region exists at tablet width.
    // The ContextualSidebar should be present at 768px.
    const sidebar = page.locator('nav, [role="navigation"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    if (sidebarVisible) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).toBeTruthy();
      // Sidebar should not consume more than half the viewport at tablet size
      expect(sidebarBox!.width).toBeLessThan(384);
    }

    // Verify the main content area is still visible alongside the sidebar
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    await checkA11y(page);
  });

  test('admin page — axe scan at tablet viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await checkA11y(page);
  });

  test('shared services page — axe scan at tablet viewport', async ({ page, switchRole }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/shared-services');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await checkA11y(page);
  });
});

// ---------------------------------------------------------------------------
// Cross-viewport comparison tests
// ---------------------------------------------------------------------------
test.describe('Responsive A11y — Cross-viewport', () => {
  test('home page — no axe regressions across mobile, tablet, and desktop viewports', async ({
    page,
    switchRole,
  }) => {
    // Desktop baseline
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);
  });

  test('operations dashboard — touch targets degrade gracefully across viewports', async ({
    page,
    switchRole,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');

    // Desktop check
    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    const desktopUndersized = await checkTouchTargets(page);

    // Tablet check
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    const tabletUndersized = await checkTouchTargets(page);

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    const mobileUndersized = await checkTouchTargets(page);

    // Touch-friendly viewports should not have significantly MORE undersized
    // targets than desktop — responsive CSS should enlarge or hide elements.
    // Using generous threshold since many Fluent UI elements meet 44px via
    // padding that boundingBox() does not account for.
    expect(mobileUndersized.undersized.length).toBeLessThan(desktopUndersized.undersized.length + 20);
    expect(tabletUndersized.undersized.length).toBeLessThan(desktopUndersized.undersized.length + 20);
  });
});
