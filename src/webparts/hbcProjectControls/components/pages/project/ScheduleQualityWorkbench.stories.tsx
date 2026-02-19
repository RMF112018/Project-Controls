import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { IScheduleActivity } from '@hbc/sp-services';
import { ScheduleQualityWorkbench } from './ScheduleQualityWorkbench';

function activity(seed: number, taskCode: string, start: string, finish: string, predecessors: string[] = []): IScheduleActivity {
  return {
    id: seed,
    projectCode: 'P-001',
    importId: 200,
    externalActivityKey: `quality-${taskCode}`,
    importFingerprint: `fp-${seed}`,
    lineageStatus: 'linked',
    taskCode,
    wbsCode: '1.0',
    activityName: `Quality Activity ${taskCode}`,
    activityType: 'Task Dependent',
    status: seed % 2 === 0 ? 'In Progress' : 'Not Started',
    originalDuration: seed % 3 === 0 ? 60 : 8,
    remainingDuration: 6,
    actualDuration: 1,
    baselineStartDate: null,
    baselineFinishDate: null,
    plannedStartDate: start,
    plannedFinishDate: finish,
    actualStartDate: seed % 2 === 0 ? start : null,
    actualFinishDate: null,
    remainingFloat: seed % 4 === 0 ? -2 : 18,
    freeFloat: 4,
    predecessors,
    successors: [],
    successorDetails: [],
    resources: seed % 5 === 0 ? 'Crew A, Crew B, Crew C, Crew D, Crew E' : 'Crew A',
    calendarName: 'Standard',
    primaryConstraint: seed % 7 === 0 ? 'Start On' : '',
    secondaryConstraint: '',
    isCritical: seed % 4 === 0,
    percentComplete: seed % 2 === 0 ? 25 : 0,
    startVarianceDays: null,
    finishVarianceDays: null,
    deleteFlag: false,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  };
}

const sampleActivities: IScheduleActivity[] = [
  activity(1, 'A100', '2026-03-01T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
  activity(2, 'A200', '2026-03-06T00:00:00.000Z', '2026-03-10T00:00:00.000Z', ['A100']),
  activity(3, 'A300', '2026-03-11T00:00:00.000Z', '2026-03-15T00:00:00.000Z', ['A200']),
  activity(4, 'A400', '2026-03-16T00:00:00.000Z', '2026-03-25T00:00:00.000Z', ['A300']),
];

const meta: Meta<typeof ScheduleQualityWorkbench> = {
  title: 'Pages/Project/ScheduleQualityWorkbench',
  component: ScheduleQualityWorkbench,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ScheduleQualityWorkbench>;

export const Default: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <ScheduleQualityWorkbench
        projectCode="P-001"
        activities={sampleActivities}
        onFieldReadinessRefresh={() => undefined}
      />
    </div>
  ),
};
