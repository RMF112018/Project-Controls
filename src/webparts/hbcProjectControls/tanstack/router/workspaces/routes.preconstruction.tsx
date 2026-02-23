/**
 * Preconstruction Workspace Routes
 *
 * 3 sub-hubs: Business Development, Estimating, Innovation & Digital Services.
 * 16 routes total + layout route.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireProject } from '../guards/requireProject';
import type { ITanStackRouteContext } from '../routeContext';

// Lazy page imports for code-splitting
const PreconstructionLayout = React.lazy(() =>
  import('../../../components/layouts/PreconstructionLayout').then(m => ({ default: m.PreconstructionLayout }))
);
const PreconDashboardPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/PreconDashboardPage').then(m => ({ default: m.PreconDashboardPage }))
);

// BD sub-hub
const BDDashboardPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/BDDashboardPage').then(m => ({ default: m.BDDashboardPage }))
);
const LeadManagementPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/LeadManagementPage').then(m => ({ default: m.LeadManagementPage }))
);
const GoNoGoPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/GoNoGoPage').then(m => ({ default: m.GoNoGoPage }))
);
const PipelinePage = React.lazy(() =>
  import('../../../components/pages/preconstruction/PipelinePage').then(m => ({ default: m.PipelinePage }))
);
const BDProjectHubPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/BDProjectHubPage').then(m => ({ default: m.BDProjectHubPage }))
);
const BDDocumentsPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/BDDocumentsPage').then(m => ({ default: m.BDDocumentsPage }))
);

// Estimating sub-hub
const EstimatingDashboardPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/EstimatingDashboardPage').then(m => ({ default: m.EstimatingDashboardPage }))
);
const DepartmentTrackingPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/DepartmentTrackingPage').then(m => ({ default: m.DepartmentTrackingPage }))
);
const NewJobRequestsPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/NewJobRequestsPage').then(m => ({ default: m.NewJobRequestsPage }))
);
const PostBidAutopsiesPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/PostBidAutopsiesPage').then(m => ({ default: m.PostBidAutopsiesPage }))
);
const EstimatingProjectHubPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/EstimatingProjectHubPage').then(m => ({ default: m.EstimatingProjectHubPage }))
);
const EstimatingDocumentsPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/EstimatingDocumentsPage').then(m => ({ default: m.EstimatingDocumentsPage }))
);

// IDS sub-hub
const IDSDashboardPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/IDSDashboardPage').then(m => ({ default: m.IDSDashboardPage }))
);
const IDSTrackingPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/IDSTrackingPage').then(m => ({ default: m.IDSTrackingPage }))
);
const IDSDocumentsPage = React.lazy(() =>
  import('../../../components/pages/preconstruction/IDSDocumentsPage').then(m => ({ default: m.IDSDocumentsPage }))
);

export function createPreconstructionWorkspaceRoutes(rootRoute: unknown) {
  // Layout route — feature-gated
  const preconLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'preconstruction-layout',
    component: PreconstructionLayout,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'PreconstructionWorkspace');
    },
  });

  // Top-level dashboard
  const preconDashboard = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction',
    component: PreconDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PRECON_HUB_VIEW);
    },
  });

  // ── Business Development ──────────────────────────────────────────
  const bdDashboard = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd',
    component: BDDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PRECON_HUB_VIEW);
    },
  });

  const bdLeads = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd/leads',
    component: LeadManagementPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.LEAD_READ);
    },
  });

  const bdGoNoGo = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd/go-no-go',
    component: GoNoGoPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.GONOGO_READ);
    },
  });

  const bdPipeline = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd/pipeline',
    component: PipelinePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.LEAD_READ);
    },
  });

  const bdProjectHub = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd/project-hub',
    component: BDProjectHubPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const bdDocuments = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/bd/documents',
    component: BDDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.LEAD_READ);
    },
  });

  // ── Estimating ────────────────────────────────────────────────────
  const estimatingDashboard = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating',
    component: EstimatingDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ESTIMATING_READ);
    },
  });

  const estimatingTracking = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating/tracking',
    component: DepartmentTrackingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ESTIMATING_READ);
    },
  });

  const estimatingJobRequests = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating/job-requests',
    component: NewJobRequestsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.JOB_NUMBER_REQUEST_CREATE);
    },
  });

  const estimatingPostBid = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating/post-bid',
    component: PostBidAutopsiesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ESTIMATING_READ);
    },
  });

  const estimatingProjectHub = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating/project-hub',
    component: EstimatingProjectHubPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const estimatingDocuments = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/estimating/documents',
    component: EstimatingDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ESTIMATING_READ);
    },
  });

  // ── Innovation & Digital Services ─────────────────────────────────
  const idsDashboard = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/ids',
    component: IDSDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PRECON_HUB_VIEW);
    },
  });

  const idsTracking = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/ids/tracking',
    component: IDSTrackingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PRECON_READ);
    },
  });

  const idsDocuments = createRoute({
    getParentRoute: () => preconLayout as never,
    path: '/preconstruction/ids/documents',
    component: IDSDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PRECON_READ);
    },
  });

  return [
    preconLayout.addChildren([
      preconDashboard,
      // BD
      bdDashboard,
      bdLeads,
      bdGoNoGo,
      bdPipeline,
      bdProjectHub,
      bdDocuments,
      // Estimating
      estimatingDashboard,
      estimatingTracking,
      estimatingJobRequests,
      estimatingPostBid,
      estimatingProjectHub,
      estimatingDocuments,
      // IDS
      idsDashboard,
      idsTracking,
      idsDocuments,
    ] as never),
  ] as unknown[];
}
