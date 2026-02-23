#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const statsPath = path.resolve(repoRoot, 'temp/analyze/spfx-stats.json');
const baselinePath = path.resolve(repoRoot, 'config/bundle-budget.spfx.json');
const reportPath = path.resolve(repoRoot, 'temp/analyze/spfx-size-report.json');

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'warn';
const updateBaseline = args.includes('--update-baseline');

const DEFAULT_THRESHOLDS = {
  warnPercent: 7,
  failPercent: 10,
  warnAbsoluteBytes: 51200,
  failAbsoluteBytes: 102400,
};

const MONITORED_CHUNKS = [
  'phase-preconstruction',
  'phase-operations',
  'phase-admin-hub',
  'phase-shared',
  'lib-echarts-runtime',
  'lib-export-pdf',
  'lib-export-excel',
  'lib-export-canvas',
  'lib-xstate-workflow',
  'vendors',
  'runtime',
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file missing: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function basename(fileName) {
  return fileName.replace(/^.*\//, '');
}

function buildAssetSizeMap(stats) {
  const map = new Map();
  for (const asset of stats.assets || []) {
    const key = basename(asset.name || '');
    if (!key) continue;
    const existing = map.get(key) || 0;
    const next = Math.max(existing, Number(asset.size || 0));
    map.set(key, next);
  }
  return map;
}

function resolveFilePath(outputPath, fileName) {
  const direct = path.join(outputPath, fileName);
  if (fs.existsSync(direct)) return direct;

  const releaseAsset = path.join(outputPath, '../release/assets', fileName);
  if (fs.existsSync(releaseAsset)) return releaseAsset;

  return null;
}

function getCompressedSize(filePath, type) {
  const data = fs.readFileSync(filePath);
  if (type === 'gzip') return zlib.gzipSync(data).length;
  return zlib.brotliCompressSync(data).length;
}

function getPrimaryEntrypoint(stats) {
  const entrypoints = stats.entrypoints || {};
  if (entrypoints['hbc-project-controls-web-part']) {
    return 'hbc-project-controls-web-part';
  }

  let bestName = null;
  let bestSize = -1;
  for (const [entryName, entryValue] of Object.entries(entrypoints)) {
    const total = (entryValue.assets || []).reduce((sum, asset) => {
      const size = typeof asset === 'string' ? 0 : Number(asset.size || 0);
      return sum + size;
    }, 0);
    if (total > bestSize) {
      bestName = entryName;
      bestSize = total;
    }
  }

  if (!bestName) {
    throw new Error('No entrypoint found in stats file');
  }
  return bestName;
}

function getEntrypointFiles(stats, entryName) {
  const entry = stats.entrypoints?.[entryName];
  if (!entry) return [];

  return (entry.assets || [])
    .map((asset) => (typeof asset === 'string' ? asset : asset.name))
    .map((name) => basename(name || ''))
    .filter(Boolean);
}

function computeEntrypointMetrics(stats, assetSizeMap) {
  const outputPath = stats.outputPath || path.resolve(repoRoot, 'dist');
  const entryName = getPrimaryEntrypoint(stats);
  const files = getEntrypointFiles(stats, entryName);

  let rawBytes = 0;
  let gzipBytes = 0;
  let brotliBytes = 0;

  for (const file of files) {
    rawBytes += assetSizeMap.get(file) || 0;

    const filePath = resolveFilePath(outputPath, file);
    if (filePath) {
      gzipBytes += getCompressedSize(filePath, 'gzip');
      brotliBytes += getCompressedSize(filePath, 'brotli');
    }
  }

  return {
    name: entryName,
    files,
    rawBytes,
    gzipBytes,
    brotliBytes,
  };
}

function computeChunkMetrics(stats, assetSizeMap) {
  const outputPath = stats.outputPath || path.resolve(repoRoot, 'dist');
  const chunkMap = {};

  for (const chunk of stats.chunks || []) {
    const names = Array.isArray(chunk.names) ? chunk.names : [];
    const files = (chunk.files || []).map((f) => basename(f));
    if (!files.length) continue;

    const primaryName = names[0] || files[0].replace(/_[a-f0-9]+\.js$/, '').replace(/\.js$/, '').replace(/^chunk\./, '');
    if (!chunkMap[primaryName]) {
      chunkMap[primaryName] = {
        name: primaryName,
        files: [],
        rawBytes: 0,
        gzipBytes: 0,
        brotliBytes: 0,
      };
    }

    for (const file of files) {
      if (chunkMap[primaryName].files.includes(file)) continue;
      chunkMap[primaryName].files.push(file);
      chunkMap[primaryName].rawBytes += assetSizeMap.get(file) || 0;

      const filePath = resolveFilePath(outputPath, file);
      if (filePath) {
        chunkMap[primaryName].gzipBytes += getCompressedSize(filePath, 'gzip');
        chunkMap[primaryName].brotliBytes += getCompressedSize(filePath, 'brotli');
      }
    }
  }

  return chunkMap;
}

function computeTotalGzipBytes(stats) {
  const outputPath = stats.outputPath || path.resolve(repoRoot, 'dist');
  let total = 0;
  for (const asset of stats.assets || []) {
    const fileName = basename(asset.name || '');
    if (!fileName || !fileName.endsWith('.js')) continue;
    const filePath = resolveFilePath(outputPath, fileName);
    if (!filePath) continue;
    total += getCompressedSize(filePath, 'gzip');
  }
  return total;
}

function createDefaultBaseline(current) {
  const chunkBudgets = {};
  for (const chunkName of MONITORED_CHUNKS) {
    const chunk = current.chunks[chunkName];
    chunkBudgets[chunkName] = {
      rawBytes: chunk ? chunk.rawBytes : 0,
      gzipBytes: chunk ? chunk.gzipBytes : 0,
      brotliBytes: chunk ? chunk.brotliBytes : 0,
    };
  }

  return {
    baselineCommit: getGitCommit(),
    generatedAt: new Date().toISOString(),
    entrypoint: {
      name: current.entrypoint.name,
      rawBytes: current.entrypoint.rawBytes,
      gzipBytes: current.entrypoint.gzipBytes,
      brotliBytes: current.entrypoint.brotliBytes,
    },
    chunkBudgets,
    thresholds: { ...DEFAULT_THRESHOLDS },
    forbiddenModulePatterns: [
      'echarts/dist/echarts',
      'echarts/lib/',
      "from 'echarts'",
      'from "echarts"',
    ],
  };
}

function delta(current, baseline) {
  const absolute = current - baseline;
  const percent = baseline > 0 ? (absolute / baseline) * 100 : 0;
  return { absolute, percent };
}

function evaluateMetric(name, currentValue, baselineValue, thresholds) {
  const diff = delta(currentValue, baselineValue);

  const isFail = diff.absolute > thresholds.failAbsoluteBytes || diff.percent > thresholds.failPercent;
  const isWarn = diff.absolute > thresholds.warnAbsoluteBytes || diff.percent > thresholds.warnPercent;

  return {
    name,
    current: currentValue,
    baseline: baselineValue,
    deltaAbsolute: diff.absolute,
    deltaPercent: diff.percent,
    status: isFail ? 'FAIL' : isWarn ? 'WARN' : 'PASS',
  };
}

function collectTopAssets(stats, limit = 10) {
  return (stats.assets || [])
    .filter((asset) => asset && asset.name && !asset.name.includes('/'))
    .sort((a, b) => Number(b.size || 0) - Number(a.size || 0))
    .slice(0, limit)
    .map((asset) => ({ name: asset.name, size: Number(asset.size || 0) }));
}

function collectTopModules(stats, limit = 10) {
  return (stats.modules || [])
    .map((module) => ({
      name: module.name || module.identifier || '<unknown>',
      size: Number(module.size || 0),
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}

function findForbiddenModules(stats, baseline) {
  const patterns = baseline.forbiddenModulePatterns || [];
  if (!patterns.length) return [];

  const modules = stats.modules || [];
  const hits = [];
  for (const pattern of patterns) {
    const matcher = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    for (const module of modules) {
      const name = String(module.name || module.identifier || '');
      if (matcher.test(name)) {
        hits.push({ pattern, module: name, size: Number(module.size || 0) });
      }
    }
  }
  return hits;
}

function scanSourceForImportViolations() {
  const roots = [
    path.resolve(repoRoot, 'src'),
    path.resolve(repoRoot, 'packages/hbc-sp-services/src'),
  ];

  const violations = [];
  const bannedRegexes = [
    { code: 'ECHARTS_DIST', regex: /from\s+['"]echarts\/dist\/echarts['"]/ },
    { code: 'ECHARTS_LIB', regex: /from\s+['"]echarts\/lib\// },
    { code: 'ECHARTS_BROAD_RUNTIME', regex: /^\s*import\s+(?!type\b).+from\s+['"]echarts['"]/ },
  ];

  function walk(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', 'lib', 'temp'].includes(entry.name)) continue;
        walk(fullPath);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split(/\r?\n/);
        lines.forEach((line, index) => {
          for (const banned of bannedRegexes) {
            if (banned.regex.test(line)) {
              violations.push({
                code: banned.code,
                file: path.relative(repoRoot, fullPath),
                line: index + 1,
                text: line.trim(),
              });
            }
          }
        });
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return violations;
}

function summarizeStatus(metricResults, forbiddenModules, importViolations) {
  if (forbiddenModules.length > 0 || importViolations.length > 0) return 'FAIL';
  if (metricResults.some((m) => m.status === 'FAIL')) return 'FAIL';
  if (metricResults.some((m) => m.status === 'WARN')) return 'WARN';
  return 'PASS';
}

function printResult(report) {
  console.log('');
  console.log('Bundle Verification:');
  console.log(`- Mode: ${report.mode}`);
  console.log(`- Status: ${report.status}`);
  console.log(`- Entrypoint: ${report.entrypoint.name}`);
  console.log(`- Entrypoint raw: ${report.entrypoint.rawBytes} bytes (baseline ${report.baseline.entrypoint.rawBytes})`);
  console.log(`- Entrypoint gzip: ${report.entrypoint.gzipBytes} bytes (baseline ${report.baseline.entrypoint.gzipBytes})`);
  console.log(`- Entrypoint brotli: ${report.entrypoint.brotliBytes} bytes (baseline ${report.baseline.entrypoint.brotliBytes})`);
  console.log(`- Total gzip JS: ${report.totalGzipBytes} bytes`);

  const entryDelta = report.metrics.find((m) => m.name === 'entrypoint.rawBytes');
  if (entryDelta) {
    console.log(`- Entry delta: ${entryDelta.deltaAbsolute} bytes (${entryDelta.deltaPercent.toFixed(2)}%) [${entryDelta.status}]`);
  }

  console.log('- Top assets:');
  for (const asset of report.topAssets) {
    console.log(`  - ${asset.name}: ${asset.size}`);
  }

  console.log('- Top modules:');
  for (const module of report.topModules) {
    console.log(`  - ${module.name}: ${module.size}`);
  }

  if (report.forbiddenModules.length > 0) {
    console.log('- Forbidden module matches:');
    for (const hit of report.forbiddenModules) {
      console.log(`  - pattern=${hit.pattern} module=${hit.module}`);
    }
  }

  if (report.importViolations.length > 0) {
    console.log('- Static import violations:');
    for (const violation of report.importViolations) {
      console.log(`  - ${violation.file}:${violation.line} [${violation.code}] ${violation.text}`);
    }
  }

  if (report.hardCapViolations.length > 0) {
    console.log('- Hard cap violations:');
    for (const violation of report.hardCapViolations) {
      console.log(`  - ${violation.metric}: actual=${violation.actual} limit=${violation.limit}`);
    }
  }

  console.log(`- Report: ${reportPath}`);
}

function main() {
  if (!['warn', 'fail'].includes(mode)) {
    throw new Error(`Invalid --mode value "${mode}". Use --mode=warn|fail`);
  }

  const stats = readJson(statsPath);
  const assetSizeMap = buildAssetSizeMap(stats);

  const current = {
    entrypoint: computeEntrypointMetrics(stats, assetSizeMap),
    chunks: computeChunkMetrics(stats, assetSizeMap),
    totalGzipBytes: computeTotalGzipBytes(stats),
  };

  let baseline;
  if (fs.existsSync(baselinePath)) {
    baseline = readJson(baselinePath);
  } else {
    baseline = createDefaultBaseline(current);
  }

  if (!baseline.thresholds) {
    baseline.thresholds = { ...DEFAULT_THRESHOLDS };
  }

  if (updateBaseline) {
    const updated = {
      ...baseline,
      baselineCommit: getGitCommit(),
      generatedAt: new Date().toISOString(),
      entrypoint: {
        name: current.entrypoint.name,
        rawBytes: current.entrypoint.rawBytes,
        gzipBytes: current.entrypoint.gzipBytes,
        brotliBytes: current.entrypoint.brotliBytes,
      },
      chunkBudgets: {
        ...(baseline.chunkBudgets || {}),
      },
      thresholds: {
        ...DEFAULT_THRESHOLDS,
        ...baseline.thresholds,
      },
      hardCaps: {
        ...(baseline.hardCaps || {}),
      },
      forbiddenModulePatterns: baseline.forbiddenModulePatterns || [
        'node_modules/echarts/dist/echarts',
        'node_modules/echarts/echarts.js',
      ],
    };

    for (const chunkName of MONITORED_CHUNKS) {
      const chunk = current.chunks[chunkName];
      updated.chunkBudgets[chunkName] = {
        rawBytes: chunk ? chunk.rawBytes : 0,
        gzipBytes: chunk ? chunk.gzipBytes : 0,
        brotliBytes: chunk ? chunk.brotliBytes : 0,
      };
    }

    ensureDir(baselinePath);
    fs.writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`);
    baseline = updated;
  }

  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...baseline.thresholds,
  };

  const metrics = [];
  metrics.push(evaluateMetric('entrypoint.rawBytes', current.entrypoint.rawBytes, baseline.entrypoint?.rawBytes || 0, thresholds));
  metrics.push(evaluateMetric('entrypoint.gzipBytes', current.entrypoint.gzipBytes, baseline.entrypoint?.gzipBytes || 0, thresholds));
  metrics.push(evaluateMetric('entrypoint.brotliBytes', current.entrypoint.brotliBytes, baseline.entrypoint?.brotliBytes || 0, thresholds));

  for (const [chunkName, budget] of Object.entries(baseline.chunkBudgets || {})) {
    const currentChunk = current.chunks[chunkName] || { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 };
    metrics.push(evaluateMetric(`chunk.${chunkName}.rawBytes`, currentChunk.rawBytes, Number(budget.rawBytes || 0), thresholds));
    metrics.push(evaluateMetric(`chunk.${chunkName}.gzipBytes`, currentChunk.gzipBytes, Number(budget.gzipBytes || 0), thresholds));
    metrics.push(evaluateMetric(`chunk.${chunkName}.brotliBytes`, currentChunk.brotliBytes, Number(budget.brotliBytes || 0), thresholds));
  }

  const forbiddenModules = findForbiddenModules(stats, baseline);
  const importViolations = scanSourceForImportViolations();
  const hardCaps = baseline.hardCaps || {};
  const hardCapViolations = [];
  if (hardCaps.entrypointRawMaxBytes && current.entrypoint.rawBytes > Number(hardCaps.entrypointRawMaxBytes)) {
    hardCapViolations.push({
      metric: 'entrypoint.rawBytes',
      limit: Number(hardCaps.entrypointRawMaxBytes),
      actual: current.entrypoint.rawBytes,
    });
  }
  if (hardCaps.totalGzipMaxBytes && current.totalGzipBytes > Number(hardCaps.totalGzipMaxBytes)) {
    hardCapViolations.push({
      metric: 'bundle.totalGzipBytes',
      limit: Number(hardCaps.totalGzipMaxBytes),
      actual: current.totalGzipBytes,
    });
  }

  const status = hardCapViolations.length > 0
    ? 'FAIL'
    : summarizeStatus(metrics, forbiddenModules, importViolations);

  const report = {
    status,
    mode,
    generatedAt: new Date().toISOString(),
    baseline: {
      path: path.relative(repoRoot, baselinePath),
      baselineCommit: baseline.baselineCommit,
      generatedAt: baseline.generatedAt,
      entrypoint: baseline.entrypoint,
      thresholds,
      hardCaps,
    },
    entrypoint: current.entrypoint,
    totalGzipBytes: current.totalGzipBytes,
    monitoredChunks: MONITORED_CHUNKS.reduce((acc, name) => {
      acc[name] = current.chunks[name] || { name, files: [], rawBytes: 0, gzipBytes: 0, brotliBytes: 0 };
      return acc;
    }, {}),
    metrics,
    hardCapViolations,
    forbiddenModules,
    importViolations,
    topAssets: collectTopAssets(stats),
    topModules: collectTopModules(stats),
  };

  ensureDir(reportPath);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  printResult(report);

  if (mode === 'fail' && status === 'FAIL') {
    process.exit(2);
  }
}

try {
  main();
} catch (error) {
  console.error(`[verify-bundle-size] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
