#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.resolve(__dirname, '../templates/template-registry.json');
const VALID_DIVISIONS = new Set(['Both', 'Commercial', 'Luxury Residential']);
const REQUIRED_ROOT_FIELDS = ['version', 'lastModified', 'lastModifiedBy', 'templates'];
const REQUIRED_TEMPLATE_FIELDS = [
  'id',
  'templateName',
  'sourcePath',
  'targetFolder',
  'fileName',
  'division',
  'active',
  'fileHash',
  'fileSize',
  'lastModifiedInTemplateSite',
];

function exitWithError(message) {
  console.error(`\nVALIDATION FAILED: ${message}`);
  process.exit(1);
}

function validateRegistry() {
  console.log(`Reading template registry: ${REGISTRY_PATH}`);

  let raw;
  try {
    raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  } catch (err) {
    exitWithError(`Cannot read registry file: ${err.message}`);
  }

  let registry;
  try {
    registry = JSON.parse(raw);
  } catch (err) {
    exitWithError(`Invalid JSON: ${err.message}`);
  }

  // Validate required root fields
  console.log('\nValidating root fields...');
  for (const field of REQUIRED_ROOT_FIELDS) {
    if (registry[field] === undefined || registry[field] === null) {
      exitWithError(`Missing required root field: "${field}"`);
    }
  }
  console.log(`  version: ${registry.version}`);
  console.log(`  lastModified: ${registry.lastModified}`);
  console.log(`  lastModifiedBy: ${registry.lastModifiedBy}`);

  // Validate templates array
  if (!Array.isArray(registry.templates)) {
    exitWithError('"templates" must be an array');
  }
  console.log(`\nValidating ${registry.templates.length} template entries...`);

  const seenIds = new Set();

  registry.templates.forEach((entry, index) => {
    const label = `Entry[${index}] (id: ${entry.id || 'MISSING'})`;

    // Required field presence
    for (const field of REQUIRED_TEMPLATE_FIELDS) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
        exitWithError(`${label}: Missing or empty required field "${field}"`);
      }
    }

    // Duplicate ID check
    if (seenIds.has(entry.id)) {
      exitWithError(`${label}: Duplicate id "${entry.id}"`);
    }
    seenIds.add(entry.id);

    // ID format check: tmpl-NNN
    if (!/^tmpl-\d{3}$/.test(entry.id)) {
      exitWithError(`${label}: id must match pattern tmpl-NNN (e.g. tmpl-001), got "${entry.id}"`);
    }

    // fileHash must start with sha256:
    if (!String(entry.fileHash).startsWith('sha256:')) {
      exitWithError(`${label}: fileHash must start with "sha256:", got "${entry.fileHash}"`);
    }

    // division must be one of the valid values
    if (!VALID_DIVISIONS.has(entry.division)) {
      exitWithError(
        `${label}: division must be one of ${JSON.stringify([...VALID_DIVISIONS])}, got "${entry.division}"`
      );
    }

    // active must be boolean
    if (typeof entry.active !== 'boolean') {
      exitWithError(`${label}: "active" must be a boolean, got ${typeof entry.active}`);
    }

    // fileSize must be a positive number
    if (typeof entry.fileSize !== 'number' || entry.fileSize <= 0) {
      exitWithError(`${label}: "fileSize" must be a positive number, got ${entry.fileSize}`);
    }

    // fileName should match the basename of sourcePath
    const derivedFileName = entry.sourcePath.split('/').pop();
    if (derivedFileName !== entry.fileName) {
      exitWithError(
        `${label}: "fileName" ("${entry.fileName}") does not match basename of "sourcePath" ("${derivedFileName}")`
      );
    }

    console.log(`  [OK] ${entry.id} — ${entry.templateName} (${entry.division})`);
  });

  console.log(`\nSUCCESS: template-registry.json is valid.`);
  console.log(`  Total entries: ${registry.templates.length}`);
  const countByDivision = {};
  for (const t of registry.templates) {
    countByDivision[t.division] = (countByDivision[t.division] || 0) + 1;
  }
  for (const [div, count] of Object.entries(countByDivision)) {
    console.log(`  ${div}: ${count}`);
  }
}

validateRegistry();
