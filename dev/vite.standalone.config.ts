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
        name: 'guard-react-misc-vendor-cycle',
        generateBundle(_outputOptions, bundle) {
          const chunkEntries = Object.entries(bundle).filter(([, value]) => value.type === 'chunk');
          const chunkImports = new Map<string, Set<string>>();
          const fileToChunk = new Map<string, string>();

          for (const [fileName] of chunkEntries) {
            const baseName = fileName.replace(/\.[^.]+$/, '');
            if (baseName.includes('react-vendor')) {
              fileToChunk.set(fileName, 'react-vendor');
            } else if (baseName.includes('misc-vendor')) {
              fileToChunk.set(fileName, 'misc-vendor');
            }
          }

          for (const [fileName, value] of chunkEntries) {
            const from = fileToChunk.get(fileName);
            if (!from) {
              continue;
            }
            for (const imported of value.imports) {
              const to = fileToChunk.get(imported);
              if (!to) {
                continue;
              }
              if (!chunkImports.has(from)) {
                chunkImports.set(from, new Set<string>());
              }
              chunkImports.get(from)?.add(to);
            }
          }

          const reactImportsMisc = chunkImports.get('react-vendor')?.has('misc-vendor') === true;
          const miscImportsReact = chunkImports.get('misc-vendor')?.has('react-vendor') === true;
          if (reactImportsMisc && miscImportsReact) {
            this.error(
              'Standalone build guard failed: detected react-vendor <-> misc-vendor circular chunk import.'
            );
          }
        },
      },
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
        '@router': path.resolve(srcRoot, 'router'),
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
      'process.env.GITOPS_FUNCTION_URL': JSON.stringify(env.VITE_GITOPS_FUNCTION_URL || ''),
      'process.env.APPINSIGHTS_CONNECTION_STRING': JSON.stringify(env.VITE_APPINSIGHTS_CONNECTION_STRING || ''),
    },
    build: {
      outDir: path.resolve(repoRoot, 'dist-standalone'),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Isolated heavy pages (pre-existing)
            if (id.includes('/components/pages/hub/AdminPanel.tsx')) return 'page-admin-panel';
            if (id.includes('/components/pages/precon/EstimatingDashboard.tsx')) return 'page-estimating-tracker';
            if (id.includes('/components/pages/project/pmp/ProjectManagementPlan.tsx')) return 'page-pmp-16-section';

            // Heavy page chunks (aligned with SPFx webpackChunkName)
            if (id.includes('/components/pages/project/SchedulePage.tsx')) return 'page-schedule';
            if (id.includes('/components/pages/project/MonthlyProjectReview.tsx')) return 'page-monthly-review';
            if (id.includes('/components/pages/project/RiskCostManagement.tsx')) return 'page-risk-cost';
            if (id.includes('/components/pages/project/BuyoutLogPage.tsx')) return 'page-buyout-contract';
            if (id.includes('/components/pages/project/ContractTracking.tsx')) return 'page-buyout-contract';
            if (id.includes('/components/pages/project/ConstraintsLogPage.tsx')) return 'page-constraints-permits';
            if (id.includes('/components/pages/project/PermitsLogPage.tsx')) return 'page-constraints-permits';
            if (id.includes('/components/pages/hub/GoNoGoScorecard.tsx')) return 'page-gonogo';
            if (id.includes('/components/pages/hub/GoNoGoDetail.tsx')) return 'page-gonogo';
            if (id.includes('/components/pages/hub/LeadDetailPage.tsx')) return 'page-lead-detail';
            if (id.includes('/components/pages/hub/LeadFormPage.tsx')) return 'page-lead-detail';
            if (id.includes('/components/pages/precon/PursuitDetail.tsx')) return 'page-pursuit-detail';
            if (id.includes('/components/pages/precon/EstimatingKickoffPage.tsx')) return 'page-pursuit-detail';
            if (id.includes('/components/pages/hub/DashboardPage.tsx')) return 'page-dashboard';
            if (id.includes('/components/pages/hub/MarketingDashboard.tsx')) return 'page-marketing';
            if (id.includes('/components/pages/project/ProjectRecord.tsx')) return 'page-project-record';

            // Fallback stabilization: unify all node_modules to prevent
            // react-vendor <-> misc-vendor cyclic initialization in standalone builds.
            if (!id.includes('node_modules')) return undefined;
            return 'vendor';
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
