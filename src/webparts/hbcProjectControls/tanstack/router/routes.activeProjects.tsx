import * as React from 'react';
import { createRootRouteWithContext, createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { activeProjectsListOptions } from '../query/queryOptions/activeProjects';

const Root = createRootRouteWithContext<ITanStackRouteContext>()({
  component: () => <React.Fragment />,
});

export const ActiveProjectsRoute = createRoute({
  getParentRoute: () => Root,
  path: '/operations',
  beforeLoad: ({ context }) => {
    const permissions = context.currentUser?.permissions;
    if (!permissions || !permissions.has(PERMISSIONS.ACTIVE_PROJECTS_VIEW)) {
      throw new Error('Access denied');
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(
    activeProjectsListOptions(context.scope, context.dataService, {})
  ),
});
