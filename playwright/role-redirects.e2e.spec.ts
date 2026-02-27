import { expect, test } from '@playwright/test';

export const roleDashboardMap = {
  'Leadership': {
    buttonText: 'Continue as Leadership',
    expectedUrlFragment: '/hub',
    expectedPageTitle: 'Main Hub Dashboard',
    expectedHeading: 'Main Hub Dashboard',
  },
  'Marketing Manager': {
    buttonText: 'Continue as Marketing Manager',
    expectedUrlFragment: '/marketing',
    expectedPageTitle: 'Marketing Dashboard',
    expectedHeading: 'Marketing Dashboard',
  },
  'Preconstruction Manager': {
    buttonText: 'Continue as Preconstruction Manager',
    expectedUrlFragment: '/preconstruction',
    expectedPageTitle: 'Preconstruction Dashboard',
    expectedHeading: 'Preconstruction Dashboard',
  },
  'Business Development Manager': {
    buttonText: 'Continue as Business Development Manager',
    expectedUrlFragment: '/bd',
    expectedPageTitle: 'BD Dashboard',
    expectedHeading: 'Business Development Dashboard',
  },
  'Estimator': {
    buttonText: 'Continue as Estimator',
    expectedUrlFragment: '/estimating',
    expectedPageTitle: 'Estimating Dashboard',
    expectedHeading: 'Estimating Dashboard',
  },
  'IDS Manager': {
    buttonText: 'Continue as IDS Manager',
    expectedUrlFragment: '/ids',
    expectedPageTitle: 'IDS Dashboard',
    expectedHeading: 'IDS Dashboard',
  },
  'Commercial Operations Manager': {
    buttonText: 'Continue as Commercial Operations Manager',
    expectedUrlFragment: '/commercial-operations',
    expectedPageTitle: 'Commercial Operations Dashboard',
    expectedHeading: 'Commercial Operations Dashboard',
  },
  'Luxury Residential': {
    buttonText: 'Continue as Luxury Residential',
    expectedUrlFragment: '/luxury-residential',
    expectedPageTitle: 'Luxury Residential Dashboard',
    expectedHeading: 'Luxury Residential Dashboard',
  },
  'Manager of Operational Excellence': {
    buttonText: 'Continue as Manager of Operational Excellence',
    expectedUrlFragment: '/opex',
    expectedPageTitle: 'OpEx Dashboard',
    expectedHeading: 'Operational Excellence',
  },
  'Safety Manager': {
    buttonText: 'Continue as Safety Manager',
    expectedUrlFragment: '/safety',
    expectedPageTitle: 'Safety Dashboard',
    expectedHeading: 'Safety Dashboard',
  },
  'Quality Control Manager': {
    buttonText: 'Continue as Quality Control Manager',
    expectedUrlFragment: '/qc-warranty',
    expectedPageTitle: 'QC & Warranty Dashboard',
    expectedHeading: 'QC & Warranty',
  },
  'Warranty Manager': {
    buttonText: 'Continue as Warranty Manager',
    expectedUrlFragment: '/qc-warranty',
    expectedPageTitle: 'QC & Warranty Dashboard',
    expectedHeading: 'QC & Warranty',
  },
  'Human Resources Manager': {
    buttonText: 'Continue as Human Resources Manager',
    expectedUrlFragment: '/people-culture',
    expectedPageTitle: 'People & Culture Dashboard',
    expectedHeading: 'People & Culture',
  },
  'Accounting Manager': {
    buttonText: 'Continue as Accounting Manager',
    expectedUrlFragment: '/accounting',
    expectedPageTitle: 'Accounting Dashboard',
    expectedHeading: 'Accounting Dashboard',
  },
  'Risk Manager': {
    buttonText: 'Continue as Risk Manager',
    expectedUrlFragment: '/risk-management',
    expectedPageTitle: 'Risk Management Dashboard',
    expectedHeading: 'Risk Management',
  },
} as const;

test.describe('Role redirects — Continue as ...', () => {
  for (const [role, cfg] of Object.entries(roleDashboardMap)) {
    test(`redirects ${role} to expected dashboard`, async ({ page }) => {
      await test.step('launch role chooser', async () => {
        await page.goto('/#/');
        await page.waitForLoadState('networkidle');
      });

      await test.step(`click role CTA: ${cfg.buttonText}`, async () => {
        const continueButton = page.getByRole('button', { name: cfg.buttonText, exact: true });
        const isLuxuryRole = role === 'Luxury Residential';
        const visible = await continueButton.isVisible().catch(() => false);

        // Surface Luxury role text drift immediately with the exact observed text values.
        if (!visible && isLuxuryRole) {
          const allButtons = await page.getByRole('button').allTextContents();
          const luxuryMatches = allButtons.map((item) => item.trim()).filter((item) => /luxury/i.test(item));
          throw new Error(
            `Luxury role button mismatch. Expected "${cfg.buttonText}". Observed luxury-labeled buttons: ${luxuryMatches.join(' | ') || 'none'}`
          );
        }

        await continueButton.click();
      });

      await test.step('verify redirect URL and router settle', async () => {
        await page.waitForURL(new RegExp(cfg.expectedUrlFragment, 'i'), { timeout: 15_000 });
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(cfg.expectedUrlFragment, 'i'));
      });

      await test.step('verify expected dashboard content', async () => {
        const heading = page.getByRole('heading', { name: cfg.expectedHeading, level: 1 });
        const titleText = page.getByText(cfg.expectedPageTitle);
        const headingVisible = await heading.isVisible().catch(() => false);
        const titleVisible = await titleText.isVisible().catch(() => false);
        expect(
          headingVisible || titleVisible,
          `Expected heading "${cfg.expectedHeading}" or page title text "${cfg.expectedPageTitle}" to be visible`
        ).toBeTruthy();
      });

      await test.step('verify Access Denied is absent', async () => {
        await expect(page.getByText(/access denied/i)).not.toBeVisible();
        await expect(page.getByText(/you do not have permission to view this page/i)).not.toBeVisible();
      });
    });
  }
});
