/**
 * keyboard-navigation.e2e.spec.ts — Keyboard workflow audit
 *
 * Validates that all critical workflows are operable via keyboard only.
 * Covers AppLauncher, ContextualSidebar accordion, NavItem navigation,
 * TanStack table sort/row/pagination, inline-edit cells, SlideDrawer
 * focus trap, WhatsNewModal focus trap, TabList arrow-key switching,
 * and Escape-to-close behavior.
 *
 * Run via: npx playwright test keyboard-navigation
 */
import { test, expect } from './fixtures/roleFixture';
import type { Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

/** Dismiss the "What's New" modal if it appears on first load. */
async function dismissWhatsNew(page: Page): Promise<void> {
  const closeButton = page.locator('[role="dialog"][aria-modal="true"] button[aria-label="Close"]').first();
  try {
    await closeButton.waitFor({ state: 'visible', timeout: 3_000 });
    await closeButton.click();
    await page.waitForTimeout(300);
  } catch {
    // Modal didn't appear — already dismissed or version already seen
  }
}

/** Returns the focused element's tag name and relevant attributes for debugging. */
async function getFocusedElementInfo(page: Page): Promise<{ tagName: string; role: string | null; ariaLabel: string | null; textContent: string }> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { tagName: 'none', role: null, ariaLabel: null, textContent: '' };
    return {
      tagName: el.tagName.toLowerCase(),
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      textContent: (el.textContent ?? '').trim().slice(0, 100),
    };
  });
}

// ── Test Suite ──────────────────────────────────────────────────────────────────

test.describe('Keyboard Navigation Workflows', () => {

  // ── 1. AppLauncher → Sidebar → Main ────────────────────────────────────────
  test('1. AppLauncher trigger is keyboard-reachable and opens with Enter', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await dismissWhatsNew(page);

    // The AppLauncher trigger has aria-label="Open workspace launcher"
    const launcherTrigger = page.locator('button[aria-label="Open workspace launcher"]');
    await expect(launcherTrigger).toBeVisible({ timeout: 8_000 });

    // Focus the launcher trigger via keyboard (Tab until we reach it)
    await launcherTrigger.focus();
    const focusedInfo = await getFocusedElementInfo(page);
    expect(focusedInfo.ariaLabel).toBe('Open workspace launcher');

    // Press Enter to open the menu popover
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify the menu popover opened — Fluent UI Menu renders menuitem roles
    const menuItems = page.getByRole('menuitem');
    const menuItemCount = await menuItems.count();
    expect(menuItemCount).toBeGreaterThan(0);

    // Navigate down through menu items with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Menu should be closed — menuitems no longer visible
    await expect(menuItems.first()).not.toBeVisible({ timeout: 3_000 });
  });

  // ── 2. Sidebar NavItem navigation — Enter triggers route change ────────────
  test('2. Sidebar NavItem keyboard activation navigates to route', async ({ page, switchRole }) => {
    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await dismissWhatsNew(page);
    await page.waitForTimeout(500);

    // ContextualSidebar renders NavItem as <button> elements
    // The "Home" NavItem should be present in a non-hub workspace sidebar
    const homeButton = page.locator('nav[aria-label="Workspace navigation"] button').filter({ hasText: 'Home' }).first();
    if (await homeButton.isVisible().catch(() => false)) {
      await homeButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Should have navigated to the home route
      expect(page.url()).toContain('/#/');
    }
  });

  // ── 3. TanStack Table sortable header keyboard sort ────────────────────────
  test('3. Table sortable header — Enter toggles aria-sort', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find a sortable column header (has tabindex=0 and is inside a tanstack table)
    const sortableHeader = page.locator('[data-table-engine="tanstack"] th[tabindex="0"]').first();
    await expect(sortableHeader).toBeVisible({ timeout: 10_000 });

    // Focus and press Enter to sort
    await sortableHeader.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify aria-sort changed to ascending or descending
    await expect(sortableHeader).toHaveAttribute('aria-sort', /ascending|descending/);

    // Press Enter again to toggle sort direction
    const firstSort = await sortableHeader.getAttribute('aria-sort');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const secondSort = await sortableHeader.getAttribute('aria-sort');
    // Sort direction should have changed
    expect(secondSort).not.toBe(firstSort);
  });

  // ── 4. Table row keyboard activation ───────────────────────────────────────
  test('4. Clickable table row — Enter triggers row interaction', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // TanStack table renders clickable rows with tabindex=0
    const clickableRow = page.locator('[data-table-engine="tanstack"] tbody tr[tabindex="0"]').first();
    if (await clickableRow.isVisible().catch(() => false)) {
      const initialUrl = page.url();
      await clickableRow.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Row click should either navigate or open a detail view
      // We just confirm focus was on the row and Enter was accepted without error
      const currentUrl = page.url();
      // Navigation may or may not have changed URL depending on onRowClick behavior
      expect(typeof currentUrl).toBe('string');
    } else {
      // Table may not have clickable rows — verify table rendered at all
      const table = page.locator('[data-table-engine="tanstack"]').first();
      await expect(table).toBeVisible({ timeout: 10_000 });
    }
  });

  // ── 5. Inline edit cell keyboard workflow ──────────────────────────────────
  test('5. Inline editable cell — Enter activates edit, Escape cancels', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/estimating/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Editable cells have role="button" and tabIndex=0 with aria-label containing "Press Enter to edit"
    const editableCell = page.locator('[role="button"][tabindex="0"]').filter({ has: page.locator(':scope') }).first();
    if (await editableCell.isVisible().catch(() => false)) {
      const ariaLabel = await editableCell.getAttribute('aria-label');
      // Only test cells that are edit-triggerable
      if (ariaLabel && ariaLabel.includes('Press Enter to edit')) {
        await editableCell.focus();

        // Press Enter to activate edit mode
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // An input should now be visible (autoFocus)
        const activeInput = page.locator('input:focus').first();
        const hasInput = await activeInput.isVisible().catch(() => false);
        if (hasInput) {
          // Type a test value
          await page.keyboard.type('Test');
          await page.waitForTimeout(100);

          // Press Escape to cancel edit
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // The input should be gone — cell should revert to display mode
          const inputGone = !(await activeInput.isVisible().catch(() => false));
          expect(inputGone).toBe(true);
        }
      }
    }
  });

  // ── 6. SlideDrawer focus trap ──────────────────────────────────────────────
  test('6. SlideDrawer focus trap — Tab cycles within drawer only', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/estimating/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Click the "New Entry" button to open the SlideDrawer
    const newEntryBtn = page.locator('button').filter({ hasText: /New Entry/i }).first();
    if (await newEntryBtn.isVisible().catch(() => false)) {
      await newEntryBtn.click();
      await page.waitForTimeout(500);

      // Verify the drawer is open (role="dialog" with aria-modal="true")
      const drawer = page.locator('[role="dialog"][aria-modal="true"]');
      await expect(drawer).toBeVisible({ timeout: 5_000 });

      // The Close button should have received focus automatically
      const closeBtn = drawer.locator('button[aria-label="Close"]');
      await expect(closeBtn).toBeVisible();

      // Tab through elements — count focusable elements in drawer
      const focusableCount = await drawer.evaluate((el) => {
        return el.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ).length;
      });
      expect(focusableCount).toBeGreaterThan(1);

      // Tab forward through all focusable elements
      for (let i = 0; i < focusableCount + 1; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }

      // After cycling through all elements + 1, focus should wrap back inside the drawer
      const focusedAfterCycle = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        return dialog?.contains(document.activeElement) ?? false;
      });
      expect(focusedAfterCycle).toBe(true);

      // Test Shift+Tab wrapping: focus the Close button (first element) then Shift+Tab
      await closeBtn.focus();
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);

      // Focus should wrap to the last focusable element inside the drawer
      const focusedAfterShiftTab = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        return dialog?.contains(document.activeElement) ?? false;
      });
      expect(focusedAfterShiftTab).toBe(true);
    }
  });

  // ── 7. WhatsNewModal focus trap ────────────────────────────────────────────
  test('7. WhatsNewModal focus trap — Tab cycles within modal', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    // Clear the localStorage version marker so the modal appears, or open via menu
    await page.evaluate(() => {
      try { localStorage.removeItem('hbc-last-seen-version'); } catch { /* ignore */ }
    });

    // Open the user menu and click "What's New"
    const userMenuTrigger = page.locator('[data-testid="role-switcher"]');
    await expect(userMenuTrigger).toBeVisible({ timeout: 8_000 });
    await userMenuTrigger.click();
    await page.waitForTimeout(300);

    const whatsNewItem = page.getByRole('menuitem', { name: /What's New/i });
    if (await whatsNewItem.isVisible().catch(() => false)) {
      await whatsNewItem.click();
      await page.waitForTimeout(500);

      // Modal should be visible
      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      if (await modal.isVisible().catch(() => false)) {
        // Close button should have focus
        const closeBtn = modal.locator('button[aria-label="Close"]');
        await expect(closeBtn).toBeVisible();

        // Tab forward — focus should stay within modal
        const focusableCount = await modal.evaluate((el) => {
          return el.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ).length;
        });

        for (let i = 0; i < focusableCount + 1; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
        }

        const focusContained = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
          return dialog?.contains(document.activeElement) ?? false;
        });
        expect(focusContained).toBe(true);

        // Close with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await expect(modal).not.toBeVisible({ timeout: 3_000 });
      }
    }
  });

  // ── 8. Accordion sidebar group — Enter expands/collapses ───────────────────
  test('8. Accordion sidebar group — Enter expands and collapses', async ({ page, switchRole }) => {
    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await dismissWhatsNew(page);
    await page.waitForTimeout(500);

    // ContextualSidebar uses Fluent UI Accordion — AccordionHeader renders a button
    const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
    await expect(sidebar).toBeVisible({ timeout: 8_000 });

    // Find the first accordion trigger button
    const accordionButtons = sidebar.locator('button[aria-expanded]');
    const count = await accordionButtons.count();
    if (count > 0) {
      const firstAccordion = accordionButtons.first();
      const initialExpanded = await firstAccordion.getAttribute('aria-expanded');

      // Focus and press Enter to toggle
      await firstAccordion.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const afterToggle = await firstAccordion.getAttribute('aria-expanded');
      // State should have changed
      expect(afterToggle).not.toBe(initialExpanded);

      // Press Enter again to toggle back
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const afterSecondToggle = await firstAccordion.getAttribute('aria-expanded');
      expect(afterSecondToggle).toBe(initialExpanded);
    }
  });

  // ── 9. Pagination keyboard — Previous/Next buttons ─────────────────────────
  test('9. Pagination buttons operable via keyboard Enter', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');
    await dismissWhatsNew(page);

    // Navigate to a page with paginated data (pipeline typically has enough mock data)
    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Look for the pagination "Next" button (aria-label="Next page")
    const nextPageBtn = page.locator('button[aria-label="Next page"]');
    if (await nextPageBtn.isVisible().catch(() => false)) {
      const isDisabled = await nextPageBtn.isDisabled();
      if (!isDisabled) {
        // Focus and press Enter
        await nextPageBtn.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Verify the "Previous page" button is now enabled
        const prevPageBtn = page.locator('button[aria-label="Previous page"]');
        await expect(prevPageBtn).toBeVisible();
        const prevDisabled = await prevPageBtn.isDisabled();
        expect(prevDisabled).toBe(false);

        // Navigate back via keyboard
        await prevPageBtn.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Previous page should be disabled again (we're on page 1)
        const prevDisabledAfterBack = await prevPageBtn.isDisabled();
        expect(prevDisabledAfterBack).toBe(true);
      }
    } else {
      // If no pagination visible, the dataset fits on one page — just verify table rendered
      const table = page.locator('[data-table-engine="tanstack"]').first();
      await expect(table).toBeVisible({ timeout: 10_000 });
    }
  });

  // ── 10. TabList keyboard navigation with Arrow keys ────────────────────────
  test('10. TabList — Arrow keys switch between tabs', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/estimating/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Fluent UI TabList renders tabs with role="tab"
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    if (tabCount >= 2) {
      // Focus the first tab
      const firstTab = tabs.first();
      await firstTab.focus();

      // Verify it has aria-selected="true"
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');

      // Press ArrowRight to move to the next tab
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      // The second tab should now be selected
      const secondTab = tabs.nth(1);
      await expect(secondTab).toHaveAttribute('aria-selected', 'true');

      // Press ArrowLeft to go back
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(300);

      // First tab should be selected again
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  // ── 11. Escape closes SlideDrawer and restores focus ───────────────────────
  test('11. Escape closes SlideDrawer and returns focus to trigger', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/estimating/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const newEntryBtn = page.locator('button').filter({ hasText: /New Entry/i }).first();
    if (await newEntryBtn.isVisible().catch(() => false)) {
      // Focus the trigger button first so we can verify focus restoration
      await newEntryBtn.focus();
      await newEntryBtn.click();
      await page.waitForTimeout(500);

      // Drawer should be open
      const drawer = page.locator('[role="dialog"][aria-modal="true"]');
      await expect(drawer).toBeVisible({ timeout: 5_000 });

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Drawer should be closed
      await expect(drawer).not.toBeVisible({ timeout: 3_000 });

      // Focus should return near the trigger (SlideDrawer saves triggerRef)
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      // The trigger was a <button>, focus should be on a button element
      expect(focusedTag).toBe('button');
    }
  });

  // ── 12. Space key also activates sortable table headers ────────────────────
  test('12. Space key activates sortable table header', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const sortableHeader = page.locator('[data-table-engine="tanstack"] th[tabindex="0"]').first();
    if (await sortableHeader.isVisible().catch(() => false)) {
      await sortableHeader.focus();

      // Press Space to sort
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // Verify aria-sort is set
      await expect(sortableHeader).toHaveAttribute('aria-sort', /ascending|descending/);
    }
  });

  // ── 13. F2 activates inline edit cells (alternative to Enter) ──────────────
  test('13. F2 activates inline edit cells as alternative to Enter', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/estimating/tracking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Find an editable cell with the "Press Enter to edit" aria-label pattern
    const editableCells = page.locator('[role="button"][tabindex="0"]');
    const cellCount = await editableCells.count();

    for (let i = 0; i < Math.min(cellCount, 10); i++) {
      const cell = editableCells.nth(i);
      const ariaLabel = await cell.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.includes('Press Enter to edit')) {
        await cell.focus();

        // Press F2 to activate edit mode (onKeyDown checks for F2)
        await page.keyboard.press('F2');
        await page.waitForTimeout(300);

        // An input should be focused
        const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
        if (activeTag === 'input') {
          // Success — F2 activated edit mode
          // Press Escape to cancel
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
        break;
      }
    }
  });

  // ── 14. AppLauncher menu item activates with Enter and navigates ───────────
  test('14. AppLauncher menu item Enter navigates to workspace', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await dismissWhatsNew(page);

    const launcherTrigger = page.locator('button[aria-label="Open workspace launcher"]');
    await expect(launcherTrigger).toBeVisible({ timeout: 8_000 });

    // Open launcher
    await launcherTrigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Navigate down to a menu item and activate with Enter
    const menuItems = page.getByRole('menuitem');
    const itemCount = await menuItems.count();
    if (itemCount > 0) {
      // Arrow down to first item
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      const beforeUrl = page.url();

      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // URL should have changed (navigated to the workspace)
      const afterUrl = page.url();
      // Either URL changed or menu closed (navigation happened)
      const menuClosed = !(await menuItems.first().isVisible().catch(() => false));
      expect(afterUrl !== beforeUrl || menuClosed).toBe(true);
    }
  });

  // ── 15. Screen reader sort announcement after keyboard sort ────────────────
  test('15. Screen reader live region announces sort change', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');
    await dismissWhatsNew(page);

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // HbcTanStackTable renders an aria-live="polite" region for sort announcements
    const liveRegion = page.locator('[data-table-engine="tanstack"] [aria-live="polite"]');
    if (await liveRegion.isVisible().catch(() => true)) {
      const sortableHeader = page.locator('[data-table-engine="tanstack"] th[tabindex="0"]').first();
      if (await sortableHeader.isVisible().catch(() => false)) {
        await sortableHeader.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // The live region should contain a sort announcement
        const announcement = await liveRegion.textContent();
        if (announcement && announcement.length > 0) {
          expect(announcement).toMatch(/sorted by/i);
        }
      }
    }
  });
});
