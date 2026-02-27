# @hbc/sp-services

Shared TypeScript library for HBC Suite applications that need common models, data services, cache/telemetry utilities, and workflow/service helpers used by HBC Project Controls.

## Installation

```bash
npm install @hbc/sp-services
```

## Peer Dependencies

This package expects host apps to provide:

- `react` `>=18.2.0 <19`
- `react-dom` `>=18.2.0 <19`
- `@pnp/sp`, `@pnp/graph`, `@pnp/queryable`, `@pnp/logging` `^4.4.1`
- `@microsoft/signalr` `^8.0.0 || ^10.0.0`
- `@fluentui/react-icons` `^2.0.230` (optional but recommended)

## Common Imports

```ts
import type { IDataService, IActiveProject, IFeatureFlag } from '@hbc/sp-services';
import { MockDataService, SharePointDataService, CACHE_KEYS, RoleName } from '@hbc/sp-services';
```

## Formatter Consumption Guidance

Use shared formatters instead of defining page-local currency/date helpers.

```ts
import { formatCurrency, formatCurrencyCompact, formatDate } from '@hbc/sp-services';

const full = formatCurrency(1250000); // $1,250,000
const compact = formatCurrencyCompact(1250000); // $1.3M

const numericDate = formatDate('2026-02-26', { dateStyle: 'numeric', placeholder: '—' });
const shortDate = formatDate('2026-02-26'); // Feb 26, 2026 style
const safeMoney = formatCurrency(undefined, { placeholder: '—' });
```

Available formatter options:
- `formatCurrency(value, options?)`
  - `placeholder`, `currency`, `minimumFractionDigits`, `maximumFractionDigits`, `locale`
- `formatDate(dateStr, options?)`
  - `placeholder`, `dateStyle` (`short` or `numeric`), `locale`, `fallbackOnInvalid`

## Shared Surface Metrics (Stage 14)

- Baseline before Stage 14: `295` exported declarations (`models+utils`).
- Stage 14 closure baseline: `327` exported declarations (`models+utils`).
- Net gain: `10.8%`.

Counting method:
- Count exported `interface`, `type`, and `enum` declarations.
- Include only `src/models` and `src/utils`.
- Exclude test files.

## Governance Rules

- Prefer shared `@hbc/sp-services` models and utilities over local page-specific duplication.
- Do not introduce local `formatCurrency` / `formatDate` helpers in page modules when shared utilities exist.
- Any shared-surface regression below the Stage 14 baseline (`327`) requires explicit release waiver and remediation plan.

## Monorepo Consumption (this repo)

- Root app consumes `@hbc/sp-services` via npm workspaces.
- Build the package before app bundling:

```bash
npm run build:lib
```

## Publish Workflow

From the repository root:

```bash
# 1) Build package artifacts
npm run build:lib

# 2) Validate publish contents
npm run --workspace=packages/hbc-sp-services pack:local

# 3) Validate publish command (no publish side effects)
npm run --workspace=packages/hbc-sp-services publish:check
```

When ready for internal registry publication:

```bash
cd packages/hbc-sp-services
npm publish --access restricted
```

## Versioning Guidance

- Use semantic versioning.
- `MAJOR`: breaking API/type signature changes.
- `MINOR`: backward-compatible new exports/features.
- `PATCH`: backward-compatible fixes/docs/metadata changes.
