import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(currentDir, '../src/webparts/hbcProjectControls');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@chromatic-com/storybook',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  typescript: {
    check: false,              // ts-jest handles type-checking; transpileOnly here
    reactDocgen: 'react-docgen-typescript',
  },

  webpackFinal: async (config) => {
    // ── Path aliases (mirror dev/webpack.config.js exactly) ──────────────
    config.resolve!.alias = {
      ...config.resolve!.alias,
      '@webparts': path.resolve(currentDir, '../src/webparts'),
      '@components': path.resolve(srcRoot, 'components'),
      '@hooks': path.resolve(srcRoot, 'components/hooks'),
      '@contexts': path.resolve(srcRoot, 'components/contexts'),
      '@theme': path.resolve(srcRoot, 'theme'),
      '@router': path.resolve(srcRoot, 'router'),
      // Resolve @hbc/sp-services to source (not compiled lib) for HMR
      '@hbc/sp-services': path.resolve(currentDir, '../packages/hbc-sp-services/src'),
      // Pin React to root — prevents duplicate react-dom/client errors
      'react': path.resolve(currentDir, '../node_modules/react'),
      'react-dom': path.resolve(currentDir, '../node_modules/react-dom'),
      'react-dom/client': path.resolve(currentDir, '../node_modules/react-dom/client'),
      'scheduler': path.resolve(currentDir, '../node_modules/scheduler'),
      '@fluentui/react-icons': path.resolve(currentDir, '../node_modules/@fluentui/react-icons'),
      // SP shims — reuse dev/shims/ directly
      '@microsoft/sp-core-library': path.resolve(currentDir, '../dev/shims/sp-core-library.ts'),
      '@microsoft/sp-webpart-base': path.resolve(currentDir, '../dev/shims/sp-webpart-base.ts'),
      '@microsoft/sp-property-pane': path.resolve(currentDir, '../dev/shims/sp-property-pane.ts'),
    };

    config.resolve!.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    config.resolve!.modules = [
      path.resolve(currentDir, '../node_modules'),
      'node_modules',
    ];

    // ── TypeScript loader ─────────────────────────────────────────────────
    config.module!.rules = [
      ...(config.module!.rules || []).filter(
        (r) => !(r as { test?: RegExp }).test?.toString().includes('tsx?')
      ),
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.resolve(currentDir, 'tsconfig.storybook.json'),
          },
        },
        exclude: /node_modules/,
      },
    ];

    return config;
  },
};

export default config;
