import { injectAxe, checkA11y } from 'axe-playwright';
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    try {
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: { html: true },
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Storybook accessibility check failed for URL: ${page.url()}\n${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
};

export default config;
