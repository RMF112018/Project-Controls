import { test, expect } from './fixtures/roleFixture';

test('debug runtime', async ({ page, switchRole }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  await page.goto('/#/');
  await page.waitForLoadState('networkidle');
  await switchRole('SuperAdmin');
  await page.waitForTimeout(2000);

  console.log('=== BEFORE NAVIGATION ===');
  console.log('Errors so far:', JSON.stringify(errors));

  await page.goto('/#/operations/project');
  await page.waitForTimeout(5000);

  console.log('=== AFTER NAVIGATION ===');
  console.log('URL:', page.url());
  console.log('Errors:', JSON.stringify(errors));

  await page.screenshot({ path: 'test-results/debug-screenshot.png' });
  expect(true).toBe(true);
});
