import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, 'VITE_');
  const dataServiceMode = env.VITE_DATA_SERVICE_MODE || 'mock';
  const srcRoot = path.resolve(repoRoot, 'src/webparts/hbcProjectControls');
  const analyze = process.env.STANDALONE_ANALYZE === 'true';

  return {
    root: __dirname,
    publicDir: path.resolve(repoRoot, 'public'),
    plugins: [
      react(),
      {
        name: 'inject-standalone-entry',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            if (
              html.includes('src="/index.tsx"') ||
              html.includes("src='/index.tsx'") ||
              html.includes('src="./index.tsx"') ||
              html.includes("src='./index.tsx'")
            ) {
              return html;
            }
            return html.replace('</body>', '  <script type="module" src="./index.tsx"></script>\n</body>');
          }
        },
      },
      ...(analyze ? [
        visualizer({
          filename: path.resolve(repoRoot, 'dist-standalone/stats.html'),
          gzipSize: true,
          brotliSize: true,
        }),
      ] : []),
    ],
    resolve: {
      alias: {
        '@webparts': path.resolve(repoRoot, 'src/webparts'),
        '@components': path.resolve(srcRoot, 'components'),
        '@hooks': path.resolve(srcRoot, 'components/hooks'),
        '@contexts': path.resolve(srcRoot, 'components/contexts'),
        '@theme': path.resolve(srcRoot, 'theme'),
        '@hbc/sp-services': path.resolve(repoRoot, 'packages/hbc-sp-services/src'),
        '@fluentui/react-icons': path.resolve(repoRoot, 'node_modules/@fluentui/react-icons'),
        react: path.resolve(repoRoot, 'node_modules/react'),
        'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
        'react-dom/client': path.resolve(repoRoot, 'node_modules/react-dom/client'),
        scheduler: path.resolve(repoRoot, 'node_modules/scheduler'),
        '@microsoft/sp-core-library': path.resolve(repoRoot, 'dev/shims/sp-core-library.ts'),
        '@microsoft/sp-webpart-base': path.resolve(repoRoot, 'dev/shims/sp-webpart-base.ts'),
        '@microsoft/sp-property-pane': path.resolve(repoRoot, 'dev/shims/sp-property-pane.ts'),
      },
    },
    define: {
      'process.env.REACT_APP_USE_MOCK': JSON.stringify(dataServiceMode !== 'standalone' ? 'true' : 'false'),
      'process.env.DEMO_MODE': JSON.stringify('false'),
      'process.env.DATA_SERVICE_MODE': JSON.stringify(dataServiceMode),
      'process.env.AAD_CLIENT_ID': JSON.stringify(env.VITE_AAD_CLIENT_ID || ''),
      'process.env.AAD_TENANT_ID': JSON.stringify(env.VITE_AAD_TENANT_ID || ''),
      'process.env.SP_HUB_URL': JSON.stringify(env.VITE_SP_HUB_URL || ''),
      'process.env.SP_SITE_URL': JSON.stringify(env.VITE_SP_SITE_URL || ''),
      'process.env.APPINSIGHTS_CONNECTION_STRING': JSON.stringify(env.VITE_APPINSIGHTS_CONNECTION_STRING || ''),
    },
    build: {
      outDir: path.resolve(repoRoot, 'dist-standalone'),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) return 'react-vendor';
            if (id.includes('/@fluentui/')) return 'fluent-vendor';
            if (id.includes('/@pnp/')) return 'pnp-vendor';
            if (id.includes('/@azure/msal-')) return 'msal-vendor';
            if (id.includes('/echarts') || id.includes('/echarts-for-react/')) return 'echarts-vendor';
            return 'misc-vendor';
          }
        }
      }
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
