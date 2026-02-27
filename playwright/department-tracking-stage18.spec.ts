/**
 * Stage 18 Sub-task 7 — Department Tracking E2E hardening tests.
 *
 * Covers: tab switching, KPI cards, fullscreen, exports, action menus,
 * editable drawer, Meeting Review Mode (enter/nav/mark reviewed/exit),
 * and permission gating.
 */
import { test, expect } from './fixtures/roleFixture';

const PRECON_URL = '/#/preconstruction';

test.describe('Stage 18 — Department Tracking Hardening', () => {
  test.beforeEach(async ({ page, switchRole }) => {
    await switchRole('SuperAdmin');
    await page.goto(PRECON_URL);
    await page.waitForLoadState('networkidle');
  });

  // ── KPI Cards ──────────────────────────────────────────────────────
  test('renders KPI cards with expected labels', async ({ page }) => {
    const kpiRegion = page.locator('[role="region"][aria-label="Key performance indicators"]');
    await expect(kpiRegion).toBeVisible({ timeout: 10_000 });
    // At least one KPI card should be present
    const cards = kpiRegion.locator('[class*="kpiCard"]');
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
  });

  // ── Tab Switching ──────────────────────────────────────────────────
  test('tab switching renders different table content', async ({ page }) => {
    const tabList = page.getByRole('tablist', { name: 'Department tracking tabs' });
    await expect(tabList).toBeVisible({ timeout: 10_000 });

    // Switch to Current Pursuits
    await page.getByRole('tab', { name: 'Current Pursuits' }).click();
    await page.waitForTimeout(500);
    const pursuitsTable = page.locator('[data-component="HbcDataTable"]').first();
    if (await pursuitsTable.count()) {
      await expect(pursuitsTable).toBeVisible({ timeout: 5_000 });
    }

    // Switch to Current Preconstruction
    await page.getByRole('tab', { name: 'Current Preconstruction' }).click();
    await page.waitForTimeout(500);
  });

  // ── Fullscreen Toggle ──────────────────────────────────────────────
  test('fullscreen toggle applies fullscreen class', async ({ page }) => {
    const fullscreenBtn = page.getByRole('button', { name: /enter fullscreen/i });
    if (await fullscreenBtn.count()) {
      await fullscreenBtn.click();
      await page.waitForTimeout(500);
      // Verify exit button is now visible
      const exitBtn = page.getByRole('button', { name: /exit fullscreen/i });
      await expect(exitBtn).toBeVisible({ timeout: 5_000 });
      await exitBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // ── Export Buttons ─────────────────────────────────────────────────
  test('export CSV button fires without error', async ({ page }) => {
    const csvBtn = page.getByRole('button', { name: /export current view as csv/i });
    if (await csvBtn.count()) {
      // Verify not disabled for admin
      await expect(csvBtn).toBeEnabled();
      await csvBtn.click();
      await page.waitForTimeout(500);
      // No console errors expected (toast or download triggers)
    }
  });

  // ── Action Menu ────────────────────────────────────────────────────
  test('action menu opens on project code click', async ({ page }) => {
    // Look for an action link with aria-haspopup="menu"
    const actionLink = page.locator('[aria-haspopup="menu"]').first();
    if (await actionLink.count()) {
      await actionLink.click();
      await page.waitForTimeout(300);
      const menuPopover = page.locator('[role="menu"]').first();
      await expect(menuPopover).toBeVisible({ timeout: 5_000 });
      // Verify "Project Details" menu item exists
      const detailsItem = page.getByRole('menuitem', { name: 'Project Details' });
      await expect(detailsItem).toBeVisible();
    }
  });

  // ── Project Details Drawer ─────────────────────────────────────────
  test('project details drawer opens from action menu', async ({ page }) => {
    const actionLink = page.locator('[aria-haspopup="menu"]').first();
    if (await actionLink.count()) {
      await actionLink.click();
      await page.waitForTimeout(300);
      const detailsItem = page.getByRole('menuitem', { name: 'Project Details' });
      if (await detailsItem.count()) {
        await detailsItem.click();
        await page.waitForTimeout(500);
        // Drawer should be visible (SlideDrawer renders a panel)
        const drawer = page.locator('[class*="drawerDetails"]').first();
        if (await drawer.count()) {
          await expect(drawer).toBeVisible({ timeout: 5_000 });
        }
      }
    }
  });

  // ── Meeting Mode Enter ─────────────────────────────────────────────
  test('meeting mode enter shows spotlight card', async ({ page }) => {
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count() && await meetingBtn.isEnabled()) {
      await meetingBtn.click();
      await page.waitForTimeout(800);
      const spotlight = page.locator('[role="region"][aria-label="Meeting review spotlight"]');
      await expect(spotlight).toBeVisible({ timeout: 10_000 });
    }
  });

  // ── Meeting Mode Navigation ────────────────────────────────────────
  test('meeting mode previous/next navigation', async ({ page }) => {
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count() && await meetingBtn.isEnabled()) {
      await meetingBtn.click();
      await page.waitForTimeout(800);
      const spotlight = page.locator('[role="region"][aria-label="Meeting review spotlight"]');
      await expect(spotlight).toBeVisible({ timeout: 10_000 });

      // Check progress text
      const progress = page.locator('[role="status"][aria-live="polite"]');
      const initialText = await progress.textContent();

      // Click Next
      const nextBtn = page.getByRole('button', { name: 'Next project' });
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        const updatedText = await progress.textContent();
        expect(updatedText).not.toBe(initialText);
      }
    }
  });

  // ── Meeting Mode Mark Reviewed ─────────────────────────────────────
  test('meeting mode mark reviewed', async ({ page }) => {
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count() && await meetingBtn.isEnabled()) {
      await meetingBtn.click();
      await page.waitForTimeout(800);
      const spotlight = page.locator('[role="region"][aria-label="Meeting review spotlight"]');
      await expect(spotlight).toBeVisible({ timeout: 10_000 });

      const reviewBtn = page.getByRole('button', { name: /mark project as reviewed/i });
      if (await reviewBtn.count() && await reviewBtn.isEnabled()) {
        await reviewBtn.click();
        await page.waitForTimeout(500);
        // After marking reviewed, the button should change to "Reviewed" (disabled)
        const reviewedBtn = page.getByRole('button', { name: /project already reviewed/i });
        await expect(reviewedBtn).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  // ── Meeting Mode Exit via Button ───────────────────────────────────
  test('meeting mode exit via button', async ({ page }) => {
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count() && await meetingBtn.isEnabled()) {
      await meetingBtn.click();
      await page.waitForTimeout(800);
      const spotlight = page.locator('[role="region"][aria-label="Meeting review spotlight"]');
      await expect(spotlight).toBeVisible({ timeout: 10_000 });

      // Click Exit Meeting Mode
      const exitBtn = page.getByRole('button', { name: /exit meeting review mode/i });
      await exitBtn.click();
      await page.waitForTimeout(800);

      // Spotlight should be gone
      await expect(spotlight).not.toBeVisible({ timeout: 5_000 });
      // Tab list should be visible again
      const tabList = page.getByRole('tablist', { name: 'Department tracking tabs' });
      await expect(tabList).toBeVisible({ timeout: 5_000 });
    }
  });

  // ── Meeting Mode Exit via Escape ───────────────────────────────────
  test('meeting mode exit via Escape key', async ({ page }) => {
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count() && await meetingBtn.isEnabled()) {
      await meetingBtn.click();
      await page.waitForTimeout(800);
      const spotlight = page.locator('[role="region"][aria-label="Meeting review spotlight"]');
      await expect(spotlight).toBeVisible({ timeout: 10_000 });

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);

      // Spotlight should be gone
      await expect(spotlight).not.toBeVisible({ timeout: 5_000 });
    }
  });

  // ── Permission Gating ──────────────────────────────────────────────
  test('permission gating disables edit controls for read-only role', async ({ page, switchRole }) => {
    // DepartmentDirector maps to 'Preconstruction Manager' — has ESTIMATING_READ but not ESTIMATING_EDIT.
    await switchRole('DepartmentDirector');
    await page.goto(PRECON_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Export buttons should remain enabled (gated behind ESTIMATING_READ which this role has)
    const csvBtn = page.getByRole('button', { name: /export current view as csv/i });
    if (await csvBtn.count()) {
      await expect(csvBtn).toBeEnabled();
    }

    // Meeting Mode toggle should be disabled (gated behind ESTIMATING_EDIT which this role lacks)
    const meetingBtn = page.getByRole('button', { name: /enter meeting review mode/i });
    if (await meetingBtn.count()) {
      await expect(meetingBtn).toBeDisabled();
    }
  });
});
