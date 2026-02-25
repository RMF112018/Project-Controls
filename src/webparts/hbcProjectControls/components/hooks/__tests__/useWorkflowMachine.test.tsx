import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useWorkflowMachine } from '../useWorkflowMachine';
import { PERMISSIONS, RoleName, ScorecardStatus } from '@hbc/sp-services';

const mockGetAsync = jest.fn();

jest.mock('@hbc/sp-services', () => {
  const actual = jest.requireActual('@hbc/sp-services');
  return {
    ...actual,
    WorkflowMachineFactory: {
      getAsync: (...args: unknown[]) => mockGetAsync(...args),
    },
  };
});

describe('useWorkflowMachine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { goNoGoMachine } = jest.requireActual('@hbc/sp-services');
    mockGetAsync.mockResolvedValue(goNoGoMachine);
  });

  it('hydrates machine and exposes state helpers', async () => {
    const { result } = renderHook(() =>
      useWorkflowMachine({
        machineType: 'goNoGo',
        input: {
          scorecardId: 1,
          projectCode: 'P-1',
          currentStatus: ScorecardStatus.BDDraft,
          actorRole: RoleName.BusinessDevelopmentManager,
          userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.state).toBe('bdDraft');
    expect(result.current.can('SUBMIT_FOR_REVIEW')).toBe(true);
    expect(result.current.allowedEvents).toContain('SUBMIT_FOR_REVIEW');
  });

  it('evaluates guards and filters allowedEvents correctly', async () => {
    const { result } = renderHook(() =>
      useWorkflowMachine({
        machineType: 'goNoGo',
        input: {
          scorecardId: 1,
          projectCode: 'P-1',
          currentStatus: ScorecardStatus.BDDraft,
          actorRole: RoleName.BusinessDevelopmentManager,
          userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // BD Rep with GONOGO_SUBMIT can only submit from bdDraft
    expect(result.current.can('SUBMIT_FOR_REVIEW')).toBe(true);
    expect(result.current.can('DIRECTOR_APPROVE')).toBe(false);
    expect(result.current.can('COMMITTEE_APPROVE')).toBe(false);
    expect(result.current.can('LOCK')).toBe(false);

    // allowedEvents should contain exactly the passable events
    expect(result.current.allowedEvents).toEqual(['SUBMIT_FOR_REVIEW']);
    expect(result.current.isFinal).toBe(false);

    // send is callable without error
    expect(() => {
      act(() => {
        result.current.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.BusinessDevelopmentManager });
      });
    }).not.toThrow();
  });

  it('restricts events when user lacks permission', async () => {
    const { result } = renderHook(() =>
      useWorkflowMachine({
        machineType: 'goNoGo',
        input: {
          scorecardId: 1,
          projectCode: 'P-1',
          currentStatus: ScorecardStatus.BDDraft,
          actorRole: RoleName.BusinessDevelopmentManager,
          userPermissions: [], // No permissions
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // No permissions → no allowed events
    expect(result.current.can('SUBMIT_FOR_REVIEW')).toBe(false);
    expect(result.current.allowedEvents).toEqual([]);
  });

  it('returns noop shape when disabled', () => {
    const { result } = renderHook(() =>
      useWorkflowMachine({
        machineType: 'goNoGo',
        enabled: false,
        input: {
          scorecardId: 1,
          projectCode: 'P-1',
          currentStatus: ScorecardStatus.BDDraft,
          actorRole: RoleName.BusinessDevelopmentManager,
          userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
        },
      })
    );

    expect(result.current.isReady).toBe(false);
    expect(result.current.allowedEvents).toEqual([]);
    expect(result.current.can('SUBMIT_FOR_REVIEW')).toBe(false);
    expect(result.current.state).toBe('');
    expect(result.current.isFinal).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reports error when factory rejects', async () => {
    mockGetAsync.mockRejectedValue(new Error('Machine load failed'));

    const { result } = renderHook(() =>
      useWorkflowMachine({
        machineType: 'goNoGo',
        input: {
          scorecardId: 1,
          projectCode: 'P-1',
          currentStatus: ScorecardStatus.BDDraft,
          actorRole: RoleName.BusinessDevelopmentManager,
          userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
        },
      })
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('Machine load failed');
    expect(result.current.isReady).toBe(false);
  });
});
