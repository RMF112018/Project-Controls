import type { Preview, Decorator } from '@storybook/react';
import * as React from 'react';
import { MemoryRouter } from '@router';
import { FluentProvider } from '@fluentui/react-components';
import { AppProvider } from '@components/contexts/AppContext';
import { HelpProvider } from '@components/contexts/HelpContext';
import { ToastProvider } from '@components/shared/ToastContainer';
import { hbcLightTheme } from '@theme/hbcTheme';
import { MockDataService } from '@hbc/sp-services';
import { registerHbcTheme } from '@theme/hbcEChartsTheme';

// Register ECharts HBC theme once at Storybook startup (idempotent)
registerHbcTheme();

// Singleton MockDataService — stories can override via story-level decorator
const globalMockDataService = new MockDataService();

/**
 * Global decorator — wraps every story with the full HBC provider stack.
 * Mirror of App.tsx minus SignalRProvider (no WebSocket in Storybook).
 *
 * Critical: FluentProvider must be outermost — Griffel injects CSS into
 * document <head> at FluentProvider mount. Without it, makeStyles tokens
 * resolve to undefined.
 */
export const HbcAppDecorator: Decorator = (Story, context) => {
  // Allow story-level override: parameters.dataService = new MockDataService()
  const dataService = (context.parameters.dataService as MockDataService) ?? globalMockDataService;

  return React.createElement(
    FluentProvider,
    { theme: hbcLightTheme },
    React.createElement(
      MemoryRouter,
      { initialEntries: [context.parameters.initialRoute as string ?? '/'] },
      React.createElement(
        AppProvider,
        { dataService },
        React.createElement(
          HelpProvider,
          null,
          React.createElement(ToastProvider, null, React.createElement(Story))
        )
      )
    )
  );
};

const preview: Preview = {
  decorators: [HbcAppDecorator],

  parameters: {
    // Fluent UI v9 renders via Griffel CSS-in-JS — no backgrounds CSS needed
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: '#ffffff' },
        { name: 'light-gray', value: '#f4f4f4' },
        { name: 'navy', value: '#1B2A4A' },
      ],
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },

    // Accessibility — WCAG 2.2 AA, Fluent UI v9 specific rule tuning
    a11y: {
      config: {
        rules: [
          // Component-level stories lack full page structure — disable page-level rules
          { id: 'landmark-one-main', enabled: false },
          { id: 'region', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
          // Known Fluent UI v9 false positive: duplicate aria IDs across tooltip instances
          { id: 'duplicate-id-aria', enabled: true },
          // Keep color-contrast enabled — flag violations component by component
          { id: 'color-contrast', enabled: true },
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
        },
      },
    },
  },
};

export default preview;
