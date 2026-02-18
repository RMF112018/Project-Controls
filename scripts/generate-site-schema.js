#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_OUTPUT_PATH = path.resolve(__dirname, '../templates/site-schema.json');
const LIB_SCHEMAS_PATH = path.resolve(
  __dirname,
  '../packages/hbc-sp-services/lib/utils/projectListSchemas.js'
);
const SRC_SCHEMAS_PATH = path.resolve(
  __dirname,
  '../packages/hbc-sp-services/src/utils/projectListSchemas.ts'
);

const CHECK_MODE = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Attempt to extract list names from the TypeScript source via simple regex.
// This is a best-effort parse — it finds exported const/let identifiers that
// look like list schema objects.  Full field data requires a compiled lib/.
// ---------------------------------------------------------------------------
function parseListNamesFromSource(srcPath) {
  let src;
  try {
    src = fs.readFileSync(srcPath, 'utf8');
  } catch {
    return null;
  }

  // Match: listName: 'Some_List'  or  listName: "Some_List"
  const listNameRegex = /listName\s*:\s*['"]([^'"]+)['"]/g;
  const names = [];
  let match;
  while ((match = listNameRegex.exec(src)) !== null) {
    names.push(match[1]);
  }
  return names.length > 0 ? names : null;
}

// ---------------------------------------------------------------------------
// Build the schema object
// ---------------------------------------------------------------------------
function buildSchema() {
  const generatedAt = new Date().toISOString();

  // 1. Try compiled lib/ first
  if (fs.existsSync(LIB_SCHEMAS_PATH)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PROJECT_LIST_SCHEMAS } = require(LIB_SCHEMAS_PATH);
      if (Array.isArray(PROJECT_LIST_SCHEMAS) && PROJECT_LIST_SCHEMAS.length > 0) {
        const lists = PROJECT_LIST_SCHEMAS.map((schema) => ({
          listName: schema.listName,
          fieldCount: Array.isArray(schema.fields) ? schema.fields.length : 0,
          fields: Array.isArray(schema.fields)
            ? schema.fields.map((f) => ({ internalName: f.internalName, fieldType: f.fieldType }))
            : [],
        }));
        console.log(`[generate-site-schema] Built from compiled lib/ — ${lists.length} lists`);
        return { generatedAt, generatorVersion: '1.0.0', source: 'lib', listCount: lists.length, lists };
      }
    } catch (err) {
      console.warn(`[generate-site-schema] lib/ load failed: ${err.message} — falling back`);
    }
  }

  // 2. Try regex parse of TypeScript source
  const parsedNames = parseListNamesFromSource(SRC_SCHEMAS_PATH);
  if (parsedNames) {
    const lists = parsedNames.map((listName) => ({
      listName,
      fieldCount: 0,
      note: 'Full field list available after build:lib',
    }));
    console.log(
      `[generate-site-schema] Built from source regex — ${lists.length} lists (no field data)`
    );
    return {
      generatedAt,
      generatorVersion: '1.0.0',
      source: 'src-regex',
      note: 'Run npm run build:lib in packages/hbc-sp-services to generate full schema with field data',
      listCount: lists.length,
      lists,
    };
  }

  // 3. Stub fallback — neither lib/ nor src/ is accessible
  console.warn('[generate-site-schema] Neither lib/ nor src/ found — writing stub schema');
  return {
    generatedAt,
    generatorVersion: '1.0.0',
    source: 'stub',
    note: 'Run npm run build:lib to generate full schema from projectListSchemas.ts',
    listCount: 45,
    lists: [
      {
        listName: 'Project_Info',
        fieldCount: 0,
        note: 'Full field list available after build:lib',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (CHECK_MODE) {
    console.log('[generate-site-schema] Running in --check mode');

    if (!fs.existsSync(SCHEMA_OUTPUT_PATH)) {
      console.error(
        `CHECK FAILED: ${SCHEMA_OUTPUT_PATH} does not exist. Run without --check to generate it.`
      );
      process.exit(1);
    }

    let existing;
    try {
      existing = JSON.parse(fs.readFileSync(SCHEMA_OUTPUT_PATH, 'utf8'));
    } catch (err) {
      console.error(`CHECK FAILED: Cannot parse existing schema: ${err.message}`);
      process.exit(1);
    }

    const fresh = buildSchema();

    // Compare list counts and list names (ignore generatedAt timestamp)
    const existingNames = (existing.lists || []).map((l) => l.listName).sort().join(',');
    const freshNames = (fresh.lists || []).map((l) => l.listName).sort().join(',');

    if (existing.listCount !== fresh.listCount || existingNames !== freshNames) {
      console.error(
        `CHECK FAILED: site-schema.json is out of date.\n` +
          `  Existing listCount: ${existing.listCount}, Fresh listCount: ${fresh.listCount}\n` +
          `Run node scripts/generate-site-schema.js to regenerate.`
      );
      process.exit(1);
    }

    console.log(`CHECK PASSED: site-schema.json is up to date (${existing.listCount} lists)`);
    process.exit(0);
  }

  // Generate mode
  const schema = buildSchema();
  const outputDir = path.dirname(SCHEMA_OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(SCHEMA_OUTPUT_PATH, JSON.stringify(schema, null, 2), 'utf8');
  console.log(`[generate-site-schema] Written to ${SCHEMA_OUTPUT_PATH}`);
  console.log(`  listCount: ${schema.listCount}`);
  console.log(`  source: ${schema.source}`);
}

main();
