import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InteractiveGanttV2 } from '../InteractiveGanttV2';
import { IScheduleActivity, ScheduleEngine } from '@hbc/sp-services';

const mockUpdateScheduleActivity = jest.fn();
const mockBroadcastChange = jest.fn();
const mockAddToast = jest.fn();
const mockRefresh = jest.fn();
const signalREntityCallbacks: Array<() => void> = [];

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () => Array.from({ length: options.count }, (_, index) => ({
      index,
      start: index * options.estimateSize(),
      size: options.estimateSize(),
      key: index,
    })),
    getTotalSize: () => options.count * options.estimateSize(),
  }),
}));

jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({
    dataService: {
      updateScheduleActivity: mockUpdateScheduleActivity,
    },
    currentUser: { email: 'test@example.com', displayName: 'Test User' },
  }),
}));

jest.mock('../../../contexts/SignalRContext', () => ({
  useSignalRContext: () => ({
    broadcastChange: mockBroadcastChange,
  }),
}));

jest.mock('../../../hooks/useSignalR', () => ({
  useSignalR: (options: { onEntityChanged?: () => void }) => {
    if (options?.onEntityChanged) {
      signalREntityCallbacks.push(options.onEntityChanged);
    }
    return { connectionStatus: 'connected', isEnabled: true };
  },
}));

jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

function makeActivity(id: number, taskCode: string, predecessors: string[] = []): IScheduleActivity {
  return {
    id,
    projectCode: 'P-001',
    importId: 1,
    externalActivityKey: `k-${taskCode}`,
    taskCode,
    wbsCode: '1.1',
    activityName: `Task ${taskCode}`,
    activityType: 'Task Dependent',
    status: 'Not Started',
    originalDuration: 2,
    remainingDuration: 2,
    actualDuration: 0,
    baselineStartDate: null,
    baselineFinishDate: null,
    plannedStartDate: '2026-02-01T00:00:00.000Z',
    plannedFinishDate: '2026-02-02T00:00:00.000Z',
    actualStartDate: null,
    actualFinishDate: null,
    remainingFloat: 0,
    freeFloat: 0,
    predecessors,
    successors: [],
    successorDetails: [],
    resources: '',
    calendarName: '',
    primaryConstraint: '',
    secondaryConstraint: '',
    isCritical: false,
    percentComplete: 0,
    startVarianceDays: null,
    finishVarianceDays: null,
    deleteFlag: false,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  };
}

describe('InteractiveGanttV2', () => {
  function renderSubject(activities: IScheduleActivity[]): void {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <InteractiveGanttV2
          projectCode="P-001"
          activities={activities}
          fieldReadiness={null}
          onFieldReadinessRefresh={mockRefresh}
        />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    mockUpdateScheduleActivity.mockReset().mockResolvedValue(makeActivity(1, 'A'));
    mockBroadcastChange.mockReset();
    mockAddToast.mockReset();
    mockRefresh.mockReset();
    signalREntityCallbacks.length = 0;
  });

  it('supports keyboard move and commits update', async () => {
    renderSubject([makeActivity(1, 'A')]);

    const row = screen.getByRole('row', { name: /Task A/i });
    row.focus();
    fireEvent.keyDown(row, { key: 'ArrowRight' });

    await waitFor(() => expect(mockUpdateScheduleActivity).toHaveBeenCalledTimes(1));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('blocks link creation when DAG diagnostic detects cycle', async () => {
    jest.spyOn(ScheduleEngine.prototype, 'analyzeDag').mockReturnValueOnce({
      hasCycle: true,
      cyclePaths: [['k-A', 'k-B', 'k-A']],
      openEndNodes: { noPred: [], noSucc: [] },
      orphanReferences: [],
      duplicatePredecessors: [],
      nodeCount: 2,
      edgeCount: 2,
    });

    renderSubject([makeActivity(1, 'A'), makeActivity(2, 'B')]);

    const firstRow = screen.getByRole('row', { name: /Task A/i });
    const secondRow = screen.getByRole('row', { name: /Task B/i });
    firstRow.focus();
    fireEvent.keyDown(firstRow, { key: 'l' });
    secondRow.focus();
    fireEvent.keyDown(secondRow, { key: 'Enter' });

    await waitFor(() => expect(mockAddToast).toHaveBeenCalled());
    expect(mockUpdateScheduleActivity).not.toHaveBeenCalledWith('P-001', 2, expect.objectContaining({ predecessors: expect.arrayContaining(['A']) }));
    expect(screen.getByText(/Link blocked: would introduce cycle/i)).toBeInTheDocument();
  });

  it('refreshes field readiness on inbound SignalR events', async () => {
    renderSubject([makeActivity(1, 'A')]);
    expect(signalREntityCallbacks.length).toBeGreaterThanOrEqual(2);
    const latestCallbacks = signalREntityCallbacks.slice(-2);

    act(() => {
      latestCallbacks.forEach(cb => cb());
    });

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(latestCallbacks.length));
  });
});
