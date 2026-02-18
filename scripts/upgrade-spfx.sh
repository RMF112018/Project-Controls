#!/bin/bash
# Usage: ./scripts/upgrade-spfx.sh 1.23.0
# Bumps all @microsoft/sp-* packages in package.json to the target SPFx version.
# After running: npm install && npm run build
set -e

TARGET="$1"

if [ -z "$TARGET" ]; then
  echo "Error: target version required. Usage: ./scripts/upgrade-spfx.sh 1.23.0"
  exit 1
fi

echo "Bumping SPFx packages to $TARGET..."

npm pkg set \
  "dependencies.@microsoft/sp-core-library=$TARGET" \
  "dependencies.@microsoft/sp-lodash-subset=$TARGET" \
  "dependencies.@microsoft/sp-office-ui-fabric-core=$TARGET" \
  "dependencies.@microsoft/sp-property-pane=$TARGET" \
  "dependencies.@microsoft/sp-webpart-base=$TARGET" \
  "devDependencies.@microsoft/eslint-config-spfx=$TARGET" \
  "devDependencies.@microsoft/eslint-plugin-spfx=$TARGET" \
  "devDependencies.@microsoft/sp-build-web=$TARGET" \
  "devDependencies.@microsoft/sp-module-interfaces=$TARGET"

echo "Done. Next steps:"
echo "  1. Check peer deps: npm info @microsoft/sp-build-web@$TARGET peerDependencies"
echo "  2. Update rush-stack-compiler version in devDependencies if needed"
echo "  3. Update config/package-solution.json mpnId to Undefined-$TARGET"
echo "  4. Update .yo-rc.json version field to $TARGET"
echo "  5. Run: volta run --node 22.14.0 npm install && npm run build"
