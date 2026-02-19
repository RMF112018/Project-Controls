#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const distDir = path.resolve(root, 'dist-standalone');
const outputPath = path.resolve(root, 'temp/analyze/standalone-size-report.json');

if (!fs.existsSync(distDir)) {
  console.error(`dist-standalone not found at ${distDir}. Run npm run build:standalone:analyze first.`);
  process.exit(1);
}

function collectAssets(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const assets = [];
  for (const entry of entries) {
    const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      assets.push(...collectAssets(fullPath, nextPrefix));
      continue;
    }
    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.css')) {
      continue;
    }
    const buffer = fs.readFileSync(fullPath);
    assets.push({
      name: nextPrefix,
      rawBytes: buffer.length,
      gzipBytes: zlib.gzipSync(buffer).length,
      brotliBytes: zlib.brotliCompressSync(buffer).length,
    });
  }
  return assets;
}

const files = collectAssets(distDir)
  .sort((a, b) => b.rawBytes - a.rawBytes);

const totals = files.reduce((acc, file) => {
  acc.rawBytes += file.rawBytes;
  acc.gzipBytes += file.gzipBytes;
  acc.brotliBytes += file.brotliBytes;
  return acc;
}, { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 });

const report = {
  generatedAt: new Date().toISOString(),
  totals,
  largestAssets: files.slice(0, 12),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log('Standalone bundle report generated:', outputPath);
console.log('Totals:', report.totals);
console.log('Top assets:');
for (const asset of report.largestAssets.slice(0, 5)) {
  console.log(` - ${asset.name}: raw=${asset.rawBytes} gzip=${asset.gzipBytes} brotli=${asset.brotliBytes}`);
}
