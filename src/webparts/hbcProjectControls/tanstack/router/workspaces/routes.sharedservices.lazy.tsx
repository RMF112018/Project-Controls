/**
 * Shared Services Workspace Routes
 *
 * 5 sidebar groups: Marketing, Human Resources, Accounting, Risk Management, BambooHR.
 * 24 child routes + 1 layout route = 25 routes total.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireRole } from '../guards/requireRole';
import type { ITanStackRouteContext } from '../routeContext';

// Layout
const SharedServicesLayout = React.lazy(() =>
  import('../../../components/layouts/SharedServicesLayout').then(m => ({ default: m.SharedServicesLayout }))
);

// ── Landing Dashboard ────────────────────────────────────────────────
const SharedServicesDashboardPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/SharedServicesDashboardPage').then(m => ({ default: m.SharedServicesDashboardPage }))
);

// ── Marketing Hub ────────────────────────────────────────────────────
const MarketingDashboardPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/MarketingDashboardPage').then(m => ({ default: m.MarketingDashboardPage }))
);
const MarketingResourcesPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/MarketingResourcesPage').then(m => ({ default: m.MarketingResourcesPage }))
);
const MarketingRequestsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/MarketingRequestsPage').then(m => ({ default: m.MarketingRequestsPage }))
);
const MarketingTrackingPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/MarketingTrackingPage').then(m => ({ default: m.MarketingTrackingPage }))
);
const MarketingDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/MarketingDocumentsPage').then(m => ({ default: m.MarketingDocumentsPage }))
);

// ── Human Resources Hub ──────────────────────────────────────────────
const HRDashboardPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/HRDashboardPage').then(m => ({ default: m.HRDashboardPage }))
);
const HROpeningsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/HROpeningsPage').then(m => ({ default: m.HROpeningsPage }))
);
const HRAnnouncementsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/HRAnnouncementsPage').then(m => ({ default: m.HRAnnouncementsPage }))
);
const HRInitiativesPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/HRInitiativesPage').then(m => ({ default: m.HRInitiativesPage }))
);
const HRDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/HRDocumentsPage').then(m => ({ default: m.HRDocumentsPage }))
);

// ── Accounting Hub ───────────────────────────────────────────────────
const AccountingDashboardPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/AccountingDashboardPage').then(m => ({ default: m.AccountingDashboardPage }))
);
const AccountingNewProjectSetupPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/AccountingNewProjectSetupPage').then(m => ({ default: m.AccountingNewProjectSetupPage }))
);
const AccountingReceivablesPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/AccountingReceivablesPage').then(m => ({ default: m.AccountingReceivablesPage }))
);
const AccountingDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/AccountingDocumentsPage').then(m => ({ default: m.AccountingDocumentsPage }))
);

// ── Risk Management Hub ──────────────────────────────────────────────
const RiskDashboardPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/RiskDashboardPage').then(m => ({ default: m.RiskDashboardPage }))
);
const RiskKnowledgeCenterPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/RiskKnowledgeCenterPage').then(m => ({ default: m.RiskKnowledgeCenterPage }))
);
const RiskRequestsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/RiskRequestsPage').then(m => ({ default: m.RiskRequestsPage }))
);
const RiskEnrollmentTrackingPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/RiskEnrollmentTrackingPage').then(m => ({ default: m.RiskEnrollmentTrackingPage }))
);
const RiskDocumentsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/RiskDocumentsPage').then(m => ({ default: m.RiskDocumentsPage }))
);

// ── BambooHR Integration ────────────────────────────────────────────
const BambooDirectoryPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/BambooDirectoryPage').then(m => ({ default: m.BambooDirectoryPage }))
);
const BambooOrgChartPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/BambooOrgChartPage').then(m => ({ default: m.BambooOrgChartPage }))
);
const BambooTimeOffPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/BambooTimeOffPage').then(m => ({ default: m.BambooTimeOffPage }))
);
const BambooMappingsPage = React.lazy(() =>
  import('../../../components/pages/sharedservices/BambooMappingsPage').then(m => ({ default: m.BambooMappingsPage }))
);

export const SharedServicesLayoutLazyRoute = {
  options: {
    id: 'shared-services-layout',
    component: SharedServicesLayout,
  },
};

// ── Route Factory ────────────────────────────────────────────────────

export function createSharedServicesWorkspaceRoutes(rootRoute: unknown): unknown[] {
  const sharedServicesLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'shared-services-layout',
    component: SharedServicesLayout,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'SharedServicesWorkspace');
      requireRole(context, [
        'Administrator', 'Marketing Manager', 'Human Resources Manager',
        'Accounting Manager', 'Risk Manager',
      ]);
    },
  });

  // ── Landing ──
  const dashboardRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services',
    component: SharedServicesDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SHARED_SERVICES_HUB_VIEW);
    },
  });

  // ── Marketing Hub ──
  const marketingDashboardRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/marketing',
    component: MarketingDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
    },
  });

  const marketingResourcesRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/marketing/resources',
    component: MarketingResourcesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
    },
  });

  const marketingRequestsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/marketing/requests',
    component: MarketingRequestsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MARKETING_EDIT);
    },
  });

  const marketingTrackingRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/marketing/tracking',
    component: MarketingTrackingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
    },
  });

  const marketingDocumentsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/marketing/documents',
    component: MarketingDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
    },
  });

  // ── Human Resources Hub ──
  const hrDashboardRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr',
    component: HRDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.HR_VIEW);
    },
  });

  const hrOpeningsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/openings',
    component: HROpeningsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.HR_VIEW);
    },
  });

  const hrAnnouncementsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/announcements',
    component: HRAnnouncementsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SHARED_SERVICES_HUB_VIEW);
    },
  });

  const hrInitiativesRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/initiatives',
    component: HRInitiativesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.HR_VIEW);
    },
  });

  const hrDocumentsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/documents',
    component: HRDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.HR_VIEW);
    },
  });

  // ── Accounting Hub ──
  // Stage 17 Step 1: Keep a single ACCOUNTING_QUEUE_VIEW gate for all Accounting routes.
  // Full accounting capability is hardened via Accounting Manager role/template elevation.
  const accountingDashboardRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/accounting',
    component: AccountingDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
    },
  });

  const accountingNewProjectRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/accounting/new-project',
    component: AccountingNewProjectSetupPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
    },
  });

  const accountingReceivablesRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/accounting/receivables',
    component: AccountingReceivablesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
    },
  });

  const accountingDocumentsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/accounting/documents',
    component: AccountingDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
    },
  });

  // ── Risk Management Hub ──
  const riskDashboardRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/risk',
    component: RiskDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_MANAGEMENT_VIEW);
    },
  });

  const riskKnowledgeCenterRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/risk/knowledge-center',
    component: RiskKnowledgeCenterPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_MANAGEMENT_VIEW);
    },
  });

  const riskRequestsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/risk/requests',
    component: RiskRequestsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_MANAGEMENT_EDIT);
    },
  });

  const riskEnrollmentRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/risk/enrollment',
    component: RiskEnrollmentTrackingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_MANAGEMENT_VIEW);
    },
  });

  const riskDocumentsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/risk/documents',
    component: RiskDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_MANAGEMENT_VIEW);
    },
  });

  // ── BambooHR Integration ──
  const bambooDirectoryRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/bamboo/directory',
    component: BambooDirectoryPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'BambooHRIntegration');
      requirePermission(context, PERMISSIONS.BAMBOO_VIEW);
    },
  });

  const bambooOrgChartRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/bamboo/org-chart',
    component: BambooOrgChartPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'BambooHRIntegration');
      requirePermission(context, PERMISSIONS.BAMBOO_VIEW);
    },
  });

  const bambooTimeOffRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/bamboo/time-off',
    component: BambooTimeOffPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'BambooHRIntegration');
      requirePermission(context, PERMISSIONS.BAMBOO_VIEW);
    },
  });

  const bambooMappingsRoute = createRoute({
    getParentRoute: () => sharedServicesLayout as never,
    path: '/shared-services/hr/bamboo/mappings',
    component: BambooMappingsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'BambooHRIntegration');
      requirePermission(context, PERMISSIONS.BAMBOO_SYNC);
    },
  });

  return [
    sharedServicesLayout.addChildren([
      dashboardRoute,
      // Marketing
      marketingDashboardRoute,
      marketingResourcesRoute,
      marketingRequestsRoute,
      marketingTrackingRoute,
      marketingDocumentsRoute,
      // Human Resources
      hrDashboardRoute,
      hrOpeningsRoute,
      hrAnnouncementsRoute,
      hrInitiativesRoute,
      hrDocumentsRoute,
      // Accounting
      accountingDashboardRoute,
      accountingNewProjectRoute,
      accountingReceivablesRoute,
      accountingDocumentsRoute,
      // Risk Management
      riskDashboardRoute,
      riskKnowledgeCenterRoute,
      riskRequestsRoute,
      riskEnrollmentRoute,
      riskDocumentsRoute,
      // BambooHR Integration
      bambooDirectoryRoute,
      bambooOrgChartRoute,
      bambooTimeOffRoute,
      bambooMappingsRoute,
    ] as never),
  ] as unknown[];
}
