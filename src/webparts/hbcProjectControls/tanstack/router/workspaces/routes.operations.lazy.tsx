import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import { requirePermission } from '../guards/requirePermission';
import { requireProject } from '../guards/requireProject';
import type { ITanStackRouteContext } from '../routeContext';

const BuyoutLogPage = React.lazy(() =>
  import('../../../components/pages/operations/BuyoutLogPage').then(m => ({ default: m.BuyoutLogPage }))
);
const PermitLogPage = React.lazy(() =>
  import('../../../components/pages/operations/PermitLogPage').then(m => ({ default: m.PermitLogPage }))
);
const ConstraintsLogPage = React.lazy(() =>
  import('../../../components/pages/operations/ConstraintsLogPage').then(m => ({ default: m.ConstraintsLogPage }))
);
const MonthlyReportsPage = React.lazy(() =>
  import('../../../components/pages/operations/MonthlyReportsPage').then(m => ({ default: m.MonthlyReportsPage }))
);
const SubcontractorScorecardPage = React.lazy(() =>
  import('../../../components/pages/operations/SubcontractorScorecardPage').then(m => ({ default: m.SubcontractorScorecardPage }))
);

export function createOperationsLogsRoutes(opsLayout: unknown): unknown[] {
  const logsBuyout = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/buyout',
    component: BuyoutLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
      requireProject(context);
    },
  });

  const logsPermits = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/permits',
    component: PermitLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PERMITS_VIEW);
      requireProject(context);
    },
  });

  const logsConstraints = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/constraints',
    component: ConstraintsLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
      requireProject(context);
    },
  });

  const logsMonthly = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/monthly-reports',
    component: MonthlyReportsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MONTHLY_REVIEW_PM);
      requireProject(context);
    },
  });

  const logsSubScorecard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/sub-scorecard',
    component: SubcontractorScorecardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  return [
    logsBuyout,
    logsPermits,
    logsConstraints,
    logsMonthly,
    logsSubScorecard,
  ] as unknown[];
}
