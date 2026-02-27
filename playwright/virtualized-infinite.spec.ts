import { expect, test } from '@playwright/test';

test.describe('Sprint 3 virtualized/infinite smoke', () => {
  test('virtualized routes remain stable after Stage 11 lazy branch navigation', async ({ page }) => {
    const sampleFrameJank = async (): Promise<{ maxFrameDeltaMs: number; avgFrameDeltaMs: number; sampleCount: number }> => {
      return page.evaluate(async () => {
        return new Promise<{ maxFrameDeltaMs: number; avgFrameDeltaMs: number; sampleCount: number }>((resolve) => {
          const deltas: number[] = [];
          let previous = performance.now();
          let remaining = 90;

          const step = (now: number): void => {
            deltas.push(Math.max(0, now - previous));
            previous = now;
            remaining -= 1;
            if (remaining <= 0) {
              const maxFrameDeltaMs = deltas.length > 0 ? Math.max(...deltas) : 0;
              const avgFrameDeltaMs = deltas.length > 0
                ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
                : 0;
              resolve({ maxFrameDeltaMs, avgFrameDeltaMs, sampleCount: deltas.length });
              return;
            }
            requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
        });
      });
    };
    const sampleLongTaskSummary = async (): Promise<{ longTaskCount: number; maxLongTaskMs: number; avgLongTaskMs: number; sampleWindowMs: number }> => {
      return page.evaluate(async () => {
        const sampleWindowMs = 2000;
        const startedAt = performance.now();
        const durations: number[] = [];
        const supportsLongTask = typeof PerformanceObserver !== 'undefined'
          && Array.isArray(PerformanceObserver.supportedEntryTypes)
          && PerformanceObserver.supportedEntryTypes.includes('longtask');

        if (supportsLongTask) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 0) {
                durations.push(entry.duration);
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
          await new Promise((resolve) => setTimeout(resolve, sampleWindowMs));
          observer.disconnect();
        } else {
          await new Promise((resolve) => setTimeout(resolve, sampleWindowMs));
        }

        const maxLongTaskMs = durations.length > 0 ? Math.max(...durations) : 0;
        const avgLongTaskMs = durations.length > 0
          ? durations.reduce((sum, value) => sum + value, 0) / durations.length
          : 0;
        return {
          longTaskCount: durations.length,
          maxLongTaskMs,
          avgLongTaskMs,
          sampleWindowMs: Math.max(sampleWindowMs, Math.round(performance.now() - startedAt)),
        };
      });
    };

    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hbc-dev-selected-role', 'Administrator');
        localStorage.setItem('hbc-last-seen-version', '1.0.0');
      } catch {
        // no-op
      }
    });

    const lazyRoutes = [
      '/#/shared-services/marketing',
      '/#/operations/logs/monthly-reports',
      '/#/admin',
    ];

    for (const route of lazyRoutes) {
      const startedAt = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(Date.now() - startedAt, `Expected ${route} to render within 20s`).toBeLessThan(20_000);

      const jankSummary = await sampleFrameJank();
      const longTaskSummary = await sampleLongTaskSummary();
      await test.info().attach(`virtualization-frame-jank-${route.replace(/[^a-z0-9]+/gi, '-')}`, {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({
          name: 'virtualization:frame:jank',
          route,
          timestamp: new Date().toISOString(),
          ...jankSummary,
        }, null, 2)),
      });
      await test.info().attach(`longtask-jank-summary-${route.replace(/[^a-z0-9]+/gi, '-')}`, {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({
          name: 'longtask:jank:summary',
          route,
          timestamp: new Date().toISOString(),
          ...longTaskSummary,
        }, null, 2)),
      });
    }

    const routes = [
      '/#/operations/logs/buyout',
      '/#/operations/logs/constraints',
      '/#/operations/logs/permits',
      '/#/operations/project',
    ];

    for (const route of routes) {
      const startedAt = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(Date.now() - startedAt, `Expected ${route} to render within 20s`).toBeLessThan(20_000);
    }
  });
});
