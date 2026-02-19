#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, 'src', 'webparts', 'hbcProjectControls');
const REPORT_DIR = path.join(ROOT, 'docs', 'ui-governance');
const WRITE = process.argv.includes('--write');

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const MAKESTYLES_COLOR_LITERAL_PATTERN = /(?:color|background|backgroundColor|borderColor|outlineColor|fill|stroke|boxShadow)\s*:\s*['"`](#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\))['"`]/g;

const findings = {
  generatedAt: new Date().toISOString(),
  totals: {
    filesScanned: 0,
    nativeTableFiles: 0,
    inlineStyleHits: 0,
    hardcodedHexHits: 0,
    makeStylesFiles: 0,
    nonTokenMakeStylesHits: 0,
    rawTanstackImportsOutsideAdapter: 0,
    fluentTablePrimitiveImports: 0
  },
  nativeTableFiles: [],
  inlineStyleHits: [],
  hardcodedHexHits: [],
  makeStylesFiles: [],
  nonTokenMakeStylesHits: [],
  rawTanstackImportsOutsideAdapter: [],
  fluentTablePrimitiveImports: []
};

function walk(directory, output = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'lib') {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
      continue;
    }

    if (entry.isFile()) {
      output.push(fullPath);
    }
  }
  return output;
}

function relativePath(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function pushCountEntry(list, file, count) {
  list.push({ file, count });
}

const files = walk(SRC_ROOT).filter((file) => ALLOWED_EXTENSIONS.has(path.extname(file)));

for (const file of files) {
  findings.totals.filesScanned += 1;
  const content = fs.readFileSync(file, 'utf8');
  const relFile = relativePath(file);

  if (/makeStyles\s*\(/.test(content)) {
    findings.makeStylesFiles.push(relFile);
    findings.totals.makeStylesFiles += 1;
  }

  const nonTokenMakeStylesColorHits = [...content.matchAll(MAKESTYLES_COLOR_LITERAL_PATTERN)].length;
  if (nonTokenMakeStylesColorHits > 0) {
    pushCountEntry(findings.nonTokenMakeStylesHits, relFile, nonTokenMakeStylesColorHits);
    findings.totals.nonTokenMakeStylesHits += nonTokenMakeStylesColorHits;
  }

  if (/<table\b/i.test(content)) {
    findings.nativeTableFiles.push(relFile);
    findings.totals.nativeTableFiles += 1;
  }

  const inlineStyleCount = (content.match(/style=\{\{/g) ?? []).length;
  if (inlineStyleCount > 0) {
    pushCountEntry(findings.inlineStyleHits, relFile, inlineStyleCount);
    findings.totals.inlineStyleHits += inlineStyleCount;
  }

  const hexMatches = [...content.matchAll(/['"`](#[0-9a-fA-F]{3,8})['"`]/g)];
  if (hexMatches.length > 0) {
    pushCountEntry(findings.hardcodedHexHits, relFile, hexMatches.length);
    findings.totals.hardcodedHexHits += hexMatches.length;
  }

  if (
    /from\s+['"]@tanstack\/react-table['"]/.test(content) &&
    !relFile.includes('/tanstack/table/')
  ) {
    findings.rawTanstackImportsOutsideAdapter.push(relFile);
    findings.totals.rawTanstackImportsOutsideAdapter += 1;
  }

  if (
    /from\s+['"]@fluentui\/react-components['"]/.test(content) &&
    /\b(DataGrid|Table|TableBody|TableHeader|TableHeaderCell|TableRow|TableCell)\b/.test(content)
  ) {
    findings.fluentTablePrimitiveImports.push(relFile);
    findings.totals.fluentTablePrimitiveImports += 1;
  }
}

const markdown = [
  '# UI Governance Audit Baseline',
  '',
  `Generated: ${findings.generatedAt}`,
  '',
  '## Totals',
  `- Files scanned: ${findings.totals.filesScanned}`,
  `- Native table files (` + '`<table>`' + `): ${findings.totals.nativeTableFiles}`,
  `- Inline style hits (` + '`style={{...}}`' + `): ${findings.totals.inlineStyleHits}`,
  `- Hardcoded hex hits: ${findings.totals.hardcodedHexHits}`,
  `- makeStyles files: ${findings.totals.makeStylesFiles}`,
  `- Non-token makeStyles color hits: ${findings.totals.nonTokenMakeStylesHits}`,
  `- Raw @tanstack/react-table imports outside adapter: ${findings.totals.rawTanstackImportsOutsideAdapter}`,
  `- Fluent table primitive imports: ${findings.totals.fluentTablePrimitiveImports}`,
  '',
  '## Native Table Files',
  ...(findings.nativeTableFiles.length > 0 ? findings.nativeTableFiles.map((file) => `- ${file}`) : ['- none']),
  '',
  '## Raw TanStack Imports Outside Adapter',
  ...(findings.rawTanstackImportsOutsideAdapter.length > 0
    ? findings.rawTanstackImportsOutsideAdapter.map((file) => `- ${file}`)
    : ['- none']),
  '',
  '## Non-Token makeStyles Color Hits',
  ...(findings.nonTokenMakeStylesHits.length > 0
    ? findings.nonTokenMakeStylesHits.map((hit) => `- ${hit.file} (${hit.count})`)
    : ['- none']),
  '',
  '## Fluent Table Primitive Imports',
  ...(findings.fluentTablePrimitiveImports.length > 0
    ? findings.fluentTablePrimitiveImports.map((file) => `- ${file}`)
    : ['- none'])
].join('\n');

if (WRITE) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'audit-baseline.json'), `${JSON.stringify(findings, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(REPORT_DIR, 'audit-baseline.md'), `${markdown}\n`, 'utf8');
  console.log(`Wrote report files to ${relativePath(REPORT_DIR)}`);
} else {
  console.log(markdown);
}
