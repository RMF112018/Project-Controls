import { test, expect } from './fixtures/roleFixture';
test.describe('Project number Estimator → Accounting hand-off', () => {
  test.setTimeout(120_000);

  test('estimator dev can create a project number request without access-denied redirect', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    await switchRole('EstimatorDev');
    await page.goto('/#/preconstruction/project-number-requests');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/#\/access-denied/);

    await page.getByRole('button', { name: 'New Request' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/#\/preconstruction\/project-number-requests\/new$/);
    await expect(page).not.toHaveURL(/#\/access-denied/);

    const suffix = Date.now();
    const projectName = `E2E Estimator Create ${suffix}`;

    await page.getByLabel('Project Name').fill(projectName);
    await page.getByLabel('Street Address').fill('789 Estimator Way');
    await page.getByLabel('City, State').fill('West Palm Beach, FL');
    await page.getByLabel('Zip Code').fill('33401');
    await page.getByLabel('County').fill('Palm Beach');
    await page.getByRole('combobox', { name: 'Project Executive' }).click();
    await page.getByRole('option', { name: 'Bobby Fetting' }).click();
    await page.getByRole('combobox', { name: 'Office & Division' }).click();
    await page.getByRole('option', { name: 'HB HQ General Commercial (01-43)' }).click();

    await page.getByRole('button', { name: 'Submit (recommended)' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/#\/preconstruction\/project-number-requests$/);
    await expect(page).not.toHaveURL(/#\/access-denied/);
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });
  });

  test('estimator submits, accounting completes setup, estimator sees completion toast and refreshed status', async ({ page, switchRole }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(String(error));
    });

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    await switchRole('EstimatorDev');
    await page.goto('/#/preconstruction/project-number-requests/new');
    await page.waitForLoadState('networkidle');

    const suffix = Date.now();
    const projectName = `E2E Handoff ${suffix}`;

    await page.getByLabel('Project Name').fill(projectName);
    await page.getByLabel('Street Address').fill('123 Buildway Ave');
    await page.getByLabel('City, State').fill('West Palm Beach, FL');
    await page.getByLabel('Zip Code').fill('33401');
    await page.getByLabel('County').fill('Palm Beach');

    await page.getByRole('combobox', { name: 'Project Executive' }).click();
    await page.getByRole('option', { name: 'Bobby Fetting' }).click();

    await page.getByRole('combobox', { name: 'Office & Division' }).click();
    await page.getByRole('option', { name: 'HB HQ General Commercial (01-43)' }).click();

    await page.getByRole('button', { name: 'Submit (recommended)' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/#\/preconstruction\/project-number-requests$/);
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });

    await switchRole('AccountingManagerDev');
    await page.goto('/#/shared-services/accounting/new-project');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });
    const pendingRows = page.locator('[data-table-id="accounting-new-project-setup-queue"] tbody tr');
    await expect(pendingRows.first()).toBeVisible({ timeout: 15000 });

    // Row-click stability check: any pending row should open an editable form without freezing.
    await pendingRows.first().click({ timeout: 15000 });

    const queueRow = page.getByRole('row', { name: new RegExp(projectName) }).first();
    await queueRow.click({ timeout: 15000 });

    const jobNumberInput = page.getByPlaceholder('e.g. 26-145-01');
    const costCenterInput = page.getByPlaceholder('e.g. CC-140');
    const divisionCodeInput = page.getByPlaceholder('e.g. DIV-01');
    const phaseCodeInput = page.getByPlaceholder('e.g. PH-100');
    const initialBudgetInput = page.getByLabel('Initial Budget');
    const contingencyBudgetInput = page.getByLabel('Contingency Budget');
    const budgetNotesInput = page.getByLabel('Budget Notes');
    await expect(jobNumberInput).toBeEditable({ timeout: 15000 });
    await expect(costCenterInput).toBeEditable({ timeout: 15000 });
    await expect(divisionCodeInput).toBeEditable({ timeout: 15000 });
    await expect(phaseCodeInput).toBeEditable({ timeout: 15000 });
    await expect(initialBudgetInput).toBeEditable({ timeout: 15000 });
    await expect(contingencyBudgetInput).toBeEditable({ timeout: 15000 });
    await expect(budgetNotesInput).toBeEditable({ timeout: 15000 });
    const generatedJobNumber = `26-${String(suffix).slice(-3)}-01`;
    await jobNumberInput.fill(generatedJobNumber);
    await expect(jobNumberInput).toHaveValue(generatedJobNumber);
    await costCenterInput.fill('CC-140');
    await expect(costCenterInput).toHaveValue('CC-140');
    await divisionCodeInput.fill('DIV-01');
    await expect(divisionCodeInput).toHaveValue('DIV-01');
    await phaseCodeInput.fill('PH-100');
    await expect(phaseCodeInput).toHaveValue('PH-100');
    await initialBudgetInput.fill('1500000');
    await expect(initialBudgetInput).toHaveValue('1500000');
    await contingencyBudgetInput.fill('100000');
    await expect(contingencyBudgetInput).toHaveValue('100000');
    await budgetNotesInput.fill('Stage 17 Step 8 editability verification');
    await expect(budgetNotesInput).toHaveValue('Stage 17 Step 8 editability verification');

    const saveAndProvisionButton = page.getByRole('button', { name: 'Save + Provision Site' });
    await expect(saveAndProvisionButton).toBeVisible({ timeout: 15000 });
    await expect(saveAndProvisionButton).toBeEnabled({ timeout: 15000 });
    await saveAndProvisionButton.click();
    await expect(page.getByText('Setup complete and site provisioning triggered.')).toBeVisible({ timeout: 15000 });

    await switchRole('EstimatorDev');
    await page.goto('/#/preconstruction/project-number-requests');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Setup Complete')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Accounting setup complete for ${projectName}`)).toBeVisible({ timeout: 15000 });

    const actionableErrors = consoleErrors.filter((entry) => {
      const normalized = entry.toLowerCase();
      return !normalized.includes('favicon') && !normalized.includes('404');
    });
    expect(actionableErrors).toEqual([]);
  });
});
