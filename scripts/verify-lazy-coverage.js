#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const routerDir = path.resolve(repoRoot, 'src/webparts/hbcProjectControls/tanstack/router');
const lazyDir = path.resolve(routerDir, 'lazy');
const budgetPath = path.resolve(repoRoot, 'config/bundle-budget.spfx.json');

const args = process.argv.slice(2);
const failMode = args.includes('--fail');

function getRouteFiles() {
  return fs.readdirSync(routerDir)
    .filter(f => /^routes\..*\.tsx$/.test(f))
    .map(f => path.join(routerDir, f));
}

function getLazyFiles() {
  if (!fs.existsSync(lazyDir)) return [];
  return fs.readdirSync(lazyDir)
    .filter(f => /\.lazy\.tsx$/.test(f))
    .map(f => path.join(lazyDir, f));
}

function countCreateRoutes(routeFiles) {
  let count = 0;
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/createRoute\(\{/g);
    if (matches) count += matches.length;
  }
  return count;
}

function getLazyComponentNames(routeFiles) {
  const names = new Set();
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /^const\s+(\w+)\s*=\s*lazyRouteComponent\(/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1]);
    }
  }
  return names;
}

function countRoutesUsingLazyComponents(routeFiles, lazyComponentNames) {
  let count = 0;
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /component:\s*(\w+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (lazyComponentNames.has(match[1])) {
        count++;
      }
    }
  }
  return count;
}

function getCreateLazyReferences(routeFiles) {
  const refs = [];
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lazyImportRegex = /\.lazy\(\s*\(\)\s*=>\s*\n?\s*import\([^)]*['"]\.\/lazy\/([^'"]+)['"]\)/g;
    let match;
    while ((match = lazyImportRegex.exec(content)) !== null) {
      refs.push({
        sourceFile: path.relative(repoRoot, file),
        lazyModule: match[1],
      });
    }
  }
  return refs;
}

function countInlineRoutes(routeFiles) {
  let count = 0;
  const inlinePatterns = [
    /component:\s*\(\)\s*=>\s*<ComingSoonPage/,
    /component:\s*AccessDeniedPage/,
    /component:\s*NotFoundPage/,
  ];
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      for (const pat of inlinePatterns) {
        if (pat.test(line)) count++;
      }
    }
  }
  return count;
}

function verifyOrphanLazyFiles(lazyFiles, lazyRefs) {
  const referencedModules = new Set(lazyRefs.map(r => r.lazyModule));
  const orphans = [];
  for (const file of lazyFiles) {
    const baseName = path.basename(file, '.tsx');
    const modulePath = baseName;
    const fullModulePath = `${modulePath}`;
    if (!referencedModules.has(fullModulePath)) {
      orphans.push(path.relative(repoRoot, file));
    }
  }
  return orphans;
}

function verifyBrokenRefs(lazyRefs) {
  const broken = [];
  for (const ref of lazyRefs) {
    const expectedFile = path.resolve(routerDir, 'lazy', `${ref.lazyModule}.tsx`);
    if (!fs.existsSync(expectedFile)) {
      broken.push({
        sourceFile: ref.sourceFile,
        lazyModule: ref.lazyModule,
        expectedPath: path.relative(repoRoot, expectedFile),
      });
    }
  }
  return broken;
}

function main() {
  const routeFiles = getRouteFiles();
  const lazyFiles = getLazyFiles();

  const totalCreateRoutes = countCreateRoutes(routeFiles);
  const lazyComponentNames = getLazyComponentNames(routeFiles);
  const lazyComponentRouteCount = countRoutesUsingLazyComponents(routeFiles, lazyComponentNames);
  const lazyRefs = getCreateLazyReferences(routeFiles);
  const createLazyCount = lazyRefs.length;
  const inlineCount = countInlineRoutes(routeFiles);

  const totalLazyRoutes = lazyComponentRouteCount + createLazyCount;
  // Non-root routes: all createRoute calls. Root uses createRootRouteWithContext (not counted).
  const totalNonRootRoutes = totalCreateRoutes;
  const lazyPercent = totalNonRootRoutes > 0
    ? (totalLazyRoutes / totalNonRootRoutes) * 100
    : 0;

  // Integrity checks
  const orphans = verifyOrphanLazyFiles(lazyFiles, lazyRefs);
  const brokenRefs = verifyBrokenRefs(lazyRefs);

  // Read threshold from budget config
  let minPercent = 90; // default
  if (fs.existsSync(budgetPath)) {
    try {
      const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
      if (budget.lazyCoverage && typeof budget.lazyCoverage.minPercent === 'number') {
        minPercent = budget.lazyCoverage.minPercent;
      }
    } catch {
      // Use default
    }
  }

  const passed = lazyPercent >= minPercent && orphans.length === 0 && brokenRefs.length === 0;

  // Print summary
  console.log('');
  console.log('Lazy Route Coverage Verification');
  console.log('================================');
  console.log(`  Total non-root routes:     ${totalNonRootRoutes}`);
  console.log(`  lazyRouteComponent routes: ${lazyComponentRouteCount} (${lazyComponentNames.size} unique components)`);
  console.log(`  createLazyRoute routes:    ${createLazyCount}`);
  console.log(`  Inline routes:             ${inlineCount}`);
  console.log(`  Total lazy routes:         ${totalLazyRoutes}`);
  console.log(`  Lazy coverage:             ${lazyPercent.toFixed(1)}% (threshold: ${minPercent}%)`);
  console.log(`  Lazy files (lazy/*.tsx):    ${lazyFiles.length}`);
  console.log('');

  if (orphans.length > 0) {
    console.log('  ORPHAN lazy files (not referenced by any route):');
    for (const orphan of orphans) {
      console.log(`    - ${orphan}`);
    }
    console.log('');
  }

  if (brokenRefs.length > 0) {
    console.log('  BROKEN lazy references (file not found):');
    for (const ref of brokenRefs) {
      console.log(`    - ${ref.sourceFile} -> ${ref.expectedPath}`);
    }
    console.log('');
  }

  if (passed) {
    console.log(`  Status: PASS`);
  } else {
    const reasons = [];
    if (lazyPercent < minPercent) reasons.push(`coverage ${lazyPercent.toFixed(1)}% < ${minPercent}%`);
    if (orphans.length > 0) reasons.push(`${orphans.length} orphan lazy file(s)`);
    if (brokenRefs.length > 0) reasons.push(`${brokenRefs.length} broken lazy reference(s)`);
    console.log(`  Status: FAIL (${reasons.join(', ')})`);
  }
  console.log('');

  if (failMode && !passed) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(`[verify-lazy-coverage] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
