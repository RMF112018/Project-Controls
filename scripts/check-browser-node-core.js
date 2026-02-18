#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'dev', 'packages/hbc-sp-services/src'];
const TS_EXTENSIONS = new Set(['.ts', '.tsx']);
const NODE_CORE_MODULES = ['crypto', 'fs', 'path', 'os', 'stream', 'zlib', 'child_process', 'net', 'tls'];
const importPattern = new RegExp(
  String.raw`(?:from\s+['"]|require\(\s*['"])(?:node:)?(${NODE_CORE_MODULES.join('|')})['"]`,
  'g'
);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        continue;
      }
      walk(fullPath, out);
      continue;
    }
    if (TS_EXTENSIONS.has(path.extname(entry.name))) {
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx') || entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx')) {
        continue;
      }
      out.push(fullPath);
    }
  }
}

const files = [];
for (const rel of SCAN_DIRS) {
  walk(path.join(ROOT, rel), files);
}

const violations = [];
for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const line = content.slice(0, match.index).split('\n').length;
    violations.push({
      file: path.relative(ROOT, filePath),
      line,
      moduleName: match[1]
    });
  }
}

if (violations.length > 0) {
  console.error('Node core module imports are not allowed in browser-targeted code:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.moduleName}`);
  }
  process.exit(1);
}

console.log(`Browser Node-core import check passed (${files.length} files scanned).`);
