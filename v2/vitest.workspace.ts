import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/models',
  'packages/data-access',
  'packages/query-hooks',
  'packages/ui-kit',
  'packages/auth',
  'packages/shell',
  'apps/hub',
  'apps/project',
  'apps/precon',
  'apps/admin',
]);
