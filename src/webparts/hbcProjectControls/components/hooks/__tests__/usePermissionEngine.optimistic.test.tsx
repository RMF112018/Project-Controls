import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IDataService, IProjectTeamAssignment } from '@hbc/sp-services';
import { usePermissionEngine } from '../usePermissionEngine';
import { qk, type IQueryScope } from '../../../tanstack/query/queryKeys';

const scope: IQueryScope = {
  mode: 'mock',
  siteContext: 'hub',
  siteUrl: 'http://localhost',
  projectCode: null,
};

const mockUseAppContext = jest.fn();

jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../contexts/SignalRContext', () => ({
  useSignalRContext: () => ({
    broadcastChange: jest.fn(),
  }),
}));

jest.mock('../../../tanstack/query/useQueryScope', () => ({
  useQueryScope: () => scope,
}));

jest.mock('../../../tanstack/query/useSignalRQueryInvalidation', () => ({
  useSignalRQueryInvalidation: () => undefined,
}));

function createWrapper(client: QueryClient): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('usePermissionEngine optimistic lifecycles', () => {
  it('rolls back optimistic assignment changes when mutation fails', async () => {
    const queryClient = new QueryClient();

    const existingAssignment: IProjectTeamAssignment = {
      id: 7,
      projectCode: '25-001-01',
      userId: 'u-1',
      userDisplayName: 'Existing User',
      userEmail: 'existing@hbc.com',
      assignedRole: 'Project Manager',
      assignedBy: 'admin@hbc.com',
      assignedDate: new Date().toISOString(),
      isActive: true,
    };

    queryClient.setQueryData(
      qk.permission.assignments(scope),
      [existingAssignment]
    );

    const dataService: Partial<IDataService> = {
      getPermissionTemplates: jest.fn().mockResolvedValue([]),
      getSecurityGroupMappings: jest.fn().mockResolvedValue([]),
      createProjectTeamAssignment: jest.fn().mockRejectedValue(new Error('Network failure')),
      updateProjectTeamAssignment: jest.fn(),
      removeProjectTeamAssignment: jest.fn(),
      createPermissionTemplate: jest.fn(),
      updatePermissionTemplate: jest.fn(),
      deletePermissionTemplate: jest.fn(),
      updateSecurityGroupMapping: jest.fn(),
      resolveUserPermissions: jest.fn(),
      getAccessibleProjects: jest.fn(),
      getProjectTeamAssignments: jest.fn().mockResolvedValue([]),
      getAllProjectTeamAssignments: jest.fn().mockResolvedValue([]),
      inviteToProjectSiteGroup: jest.fn(),
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockUseAppContext.mockReturnValue({
      dataService,
      currentUser: {
        email: 'admin@hbc.com',
        displayName: 'Admin',
      },
    });

    const { result } = renderHook(() => usePermissionEngine(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect((dataService.getPermissionTemplates as jest.Mock)).toHaveBeenCalled();
      expect((dataService.getSecurityGroupMappings as jest.Mock)).toHaveBeenCalled();
    });

    await act(async () => {
      await expect(result.current.assignToProject({
        projectCode: '25-001-01',
        userEmail: 'new@hbc.com',
        userDisplayName: 'New User',
        userId: 'u-2',
        assignedRole: 'Project Engineer',
        assignedBy: 'admin@hbc.com',
        isActive: true,
      })).rejects.toThrow('Network failure');
    });

    expect(queryClient.getQueryData(qk.permission.assignments(scope))).toEqual([existingAssignment]);
  });
});
