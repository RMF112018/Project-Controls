import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IScheduleActivity, IScheduleQualityReport } from '@hbc/sp-services';
import { ScheduleQualityWorkbench } from '../ScheduleQualityWorkbench';

const mockHasPermission = jest.fn();
const mockRunScheduleQualityChecks = jest.fn();
const mockComputeFieldReadinessScore = jest.fn();
const mockGetScheduleFieldLinks = jest.fn();
const mockGetConstraints = jest.fn();
const mockGetPermits = jest.fn();
const mockUpdateScheduleActivity = jest.fn();
const mockLogAudit = jest.fn();
const mockAddToast = jest.fn();

jest.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({
    dataService: {
      runScheduleQualityChecks: mockRunScheduleQualityChecks,
      computeFieldReadinessScore: mockComputeFieldReadinessScore,
      getScheduleFieldLinks: mockGetScheduleFieldLinks,
      getConstraints: mockGetConstraints,
      getPermits: mockGetPermits,
      updateScheduleActivity: mockUpdateScheduleActivity,
      logAudit: mockLogAudit,
    },
    currentUser: { email: 'pm@test.com' },
    hasPermission: mockHasPermission,
  }),
}));

jest.mock('../../../shared/ToastContainer', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

function makeActivity(id: number, code: string): IScheduleActivity {
  const start = new Date(Date.UTC(2026, 2, id));
  const finish = new Date(Date.UTC(2026, 2, id + 2));
  return {
    id,
    projectCode: 'P-001',
    importId: 1,
    externalActivityKey: `k-${code}`,
    taskCode: code,
    wbsCode: '1.1',
    activityName: `Task ${code}`,
    activityType: 'Task Dependent',
    status: 'Not Started',
    originalDuration: 3,
    remainingDuration: 3,
    actualDuration: 0,
    baselineStartDate: null,
    baselineFinishDate: null,
    plannedStartDate: start.toISOString(),
    plannedFinishDate: finish.toISOString(),
    actualStartDate: null,
    actualFinishDate: null,
    remainingFloat: 0,
    freeFloat: 0,
    predecessors: id === 1 ? [] : [`T-${id - 1}`],
    successors: [],
    successorDetails: [],
    resources: 'Crew A',
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

function makeReport(targetCount: number): IScheduleQualityReport {
  const targetKeys = Array.from({ length: targetCount }, (_, i) => `k-T-${i + 1}`);
  return {
    projectCode: 'P-001',
    generatedAt: new Date().toISOString(),
    overallScore: 72,
    dcmaScore: 70,
    customRuleScore: 80,
    scoreBreakdown: { overallScore: 72, dcmaScore: 70, customRuleScore: 80 },
    dcmaChecks: [{
      id: 'dcma-05',
      name: 'Hard Constraints',
      passed: false,
      value: targetCount,
      threshold: 1,
      weight: 1,
      category: 'constraints',
      details: 'Hard constraints detected.',
      failedActivityKeys: targetKeys,
    }, ...Array.from({ length: 13 }, (_, index) => ({
      id: `dcma-x-${index}`,
      name: `Check ${index}`,
      passed: true,
      value: 0,
      threshold: 1,
      weight: 1,
      category: 'logic' as const,
      details: 'ok',
      failedActivityKeys: [],
    }))],
    customRuleResults: [],
    remediationSuggestions: [{
      id: 'rem-1',
      ruleId: 'dcma-05',
      title: 'Fix hard constraints',
      description: 'Clear hard constraints from targeted activities.',
      severity: 'high',
      targetActivityKeys: targetKeys,
      activityPatches: targetKeys.map(k => ({ externalActivityKey: k, patch: { primaryConstraint: '' } })),
      estimatedImpact: { cpCompressionDays: 2, avgFloatImprovementDays: 1.5, confidence: 'medium' },
    }],
    exportRows: [],
    remediationSteps: ['Fix hard constraints'],
  };
}

describe('ScheduleQualityWorkbench', () => {
  const activities = Array.from({ length: 20 }, (_, i) => makeActivity(i + 1, `T-${i + 1}`));

  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockRunScheduleQualityChecks.mockResolvedValue(makeReport(12));
    mockComputeFieldReadinessScore.mockResolvedValue({ score: 78 });
    mockGetScheduleFieldLinks.mockResolvedValue([]);
    mockGetConstraints.mockResolvedValue([]);
    mockGetPermits.mockResolvedValue([]);
    mockUpdateScheduleActivity.mockResolvedValue({});
    mockLogAudit.mockResolvedValue(undefined);
    mockAddToast.mockReset();
  });

  it('shows projected CPM impact summary when remediation is selected', async () => {
    render(<ScheduleQualityWorkbench projectCode="P-001" activities={activities} onFieldReadinessRefresh={jest.fn()} />);
    await waitFor(() => expect(mockRunScheduleQualityChecks).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('checkbox'));
    expect(await screen.findByText(/Projected CPM Impact:/i)).toBeInTheDocument();
  });

  it('prompts bulk confirmation when impacted activities exceed threshold', async () => {
    render(<ScheduleQualityWorkbench projectCode="P-001" activities={activities} onFieldReadinessRefresh={jest.fn()} />);
    await waitFor(() => expect(mockRunScheduleQualityChecks).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Selected/i }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(mockUpdateScheduleActivity).not.toHaveBeenCalled();
  });

  it('disables apply for users without schedule edit permission', async () => {
    mockHasPermission.mockReturnValue(false);
    render(<ScheduleQualityWorkbench projectCode="P-001" activities={activities} onFieldReadinessRefresh={jest.fn()} />);
    await waitFor(() => expect(mockRunScheduleQualityChecks).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('checkbox'));
    const button = screen.getByRole('button', { name: /Apply Selected/i });
    expect(button).toBeDisabled();
  });
});
