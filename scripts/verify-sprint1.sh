#!/usr/bin/env bash
set -euo pipefail

npm run lint
npx tsc --noEmit
npm run test:ci
npm run test:e2e:router-parity
npm run test:e2e:teams-core-smoke
npm run test:a11y
npm run build:standalone:report
npm run verify:bundle-size:warn
