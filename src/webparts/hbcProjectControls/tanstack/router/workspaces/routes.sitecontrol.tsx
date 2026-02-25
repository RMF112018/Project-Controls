/**
 * HB Site Control Workspace Routes
 *
 * 3 sidebar groups: Jobsite Management, Safety, Quality Control.
 * 15 child routes + 1 layout route = 16 routes total.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireRole } from '../guards/requireRole';
import type { ITanStackRouteContext } from '../routeContext';

// Layout
const SiteControlLayout = React.lazy(() =>
  import('../../../components/layouts/SiteControlLayout').then(m => ({ default: m.SiteControlLayout }))
);

// ── Landing Dashboard ────────────────────────────────────────────────
const SiteControlDashboardPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SiteControlDashboardPage').then(m => ({ default: m.SiteControlDashboardPage }))
);

// ── Jobsite Management ──────────────────────────────────────────────
const SignInDashboardPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SignInDashboardPage').then(m => ({ default: m.SignInDashboardPage }))
);
const PersonnelLogPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/PersonnelLogPage').then(m => ({ default: m.PersonnelLogPage }))
);
const SignInDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SignInDocumentsPage').then(m => ({ default: m.SignInDocumentsPage }))
);

// ── Safety ──────────────────────────────────────────────────────────
const SafetyHubPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SafetyHubPage').then(m => ({ default: m.SafetyHubPage }))
);
const SafetyInspectionsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SafetyInspectionsPage').then(m => ({ default: m.SafetyInspectionsPage }))
);
const SafetyWarningsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SafetyWarningsPage').then(m => ({ default: m.SafetyWarningsPage }))
);
const ToolBoxTalksPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/ToolBoxTalksPage').then(m => ({ default: m.ToolBoxTalksPage }))
);
const SafetyScorecardHubPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SafetyScorecardHubPage').then(m => ({ default: m.SafetyScorecardHubPage }))
);
const SafetyHubDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/SafetyHubDocumentsPage').then(m => ({ default: m.SafetyHubDocumentsPage }))
);

// ── Quality Control ─────────────────────────────────────────────────
const QCHubPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/QCHubPage').then(m => ({ default: m.QCHubPage }))
);
const QCInspectionsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/QCInspectionsPage').then(m => ({ default: m.QCInspectionsPage }))
);
const IssueResolutionPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/IssueResolutionPage').then(m => ({ default: m.IssueResolutionPage }))
);
const QCMetricsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/QCMetricsPage').then(m => ({ default: m.QCMetricsPage }))
);
const QCHubDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sitecontrol/QCHubDocumentsPage').then(m => ({ default: m.QCHubDocumentsPage }))
);

// ── Route Factory ────────────────────────────────────────────────────

export function createSiteControlWorkspaceRoutes(rootRoute: unknown): unknown[] {
  const siteControlLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'site-control-layout',
    component: SiteControlLayout,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'SiteControlWorkspace');
      requireRole(context, ['Administrator', 'Safety Manager', 'Quality Control Manager']);
    },
  });

  // ── Landing ──
  const dashboardRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control',
    component: SiteControlDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SITE_CONTROL_HUB_VIEW);
    },
  });

  // ── Jobsite Management ──
  const signinDashboardRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/signin',
    component: SignInDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SITE_CONTROL_HUB_VIEW);
    },
  });

  const personnelLogRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/signin/log',
    component: PersonnelLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SITE_CONTROL_HUB_VIEW);
    },
  });

  const signinDocumentsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/signin/documents',
    component: SignInDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SITE_CONTROL_HUB_VIEW);
    },
  });

  // ── Safety ──
  const safetyHubRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety',
    component: SafetyHubPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyInspectionsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety/inspections',
    component: SafetyInspectionsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyWarningsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety/warnings',
    component: SafetyWarningsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const toolBoxTalksRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety/toolbox-talks',
    component: ToolBoxTalksPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyScorecardRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety/scorecard',
    component: SafetyScorecardHubPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyDocumentsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/safety/documents',
    component: SafetyHubDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  // ── Quality Control ──
  const qcHubRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/qc',
    component: QCHubPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcInspectionsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/qc/inspections',
    component: QCInspectionsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const issueResolutionRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/qc/issues',
    component: IssueResolutionPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcMetricsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/qc/metrics',
    component: QCMetricsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcDocumentsRoute = createRoute({
    getParentRoute: () => siteControlLayout as never,
    path: '/site-control/qc/documents',
    component: QCHubDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  return [
    siteControlLayout.addChildren([
      dashboardRoute,
      // Jobsite Management
      signinDashboardRoute,
      personnelLogRoute,
      signinDocumentsRoute,
      // Safety
      safetyHubRoute,
      safetyInspectionsRoute,
      safetyWarningsRoute,
      toolBoxTalksRoute,
      safetyScorecardRoute,
      safetyDocumentsRoute,
      // Quality Control
      qcHubRoute,
      qcInspectionsRoute,
      issueResolutionRoute,
      qcMetricsRoute,
      qcDocumentsRoute,
    ] as never),
  ] as unknown[];
}
