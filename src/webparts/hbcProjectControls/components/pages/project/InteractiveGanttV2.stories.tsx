import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { IScheduleActivity } from '@hbc/sp-services';
import { InteractiveGanttV2 } from './InteractiveGanttV2';

function activity(seed: number, taskCode: string, start: string, finish: string, predecessors: string[] = []): IScheduleActivity {
  return {
    id: seed,
    projectCode: 'P-001',
    importId: 1001,
    externalActivityKey: `ext-${taskCode}`,
    importFingerprint: `fp-${seed}`,
    lineageStatus: 'linked',
    taskCode,
    wbsCode: '1.0',
    activityName: `Activity ${taskCode}`,
    activityType: 'Task Dependent',
    status: 'Not Started',
    originalDuration: 5,
    remainingDuration: 5,
    actualDuration: 0,
    baselineStartDate: null,
    baselineFinishDate: null,
    plannedStartDate: start,
    plannedFinishDate: finish,
    actualStartDate: null,
    actualFinishDate: null,
    remainingFloat: 0,
    freeFloat: 0,
    predecessors,
    successors: [],
    successorDetails: [],
    resources: 'Crew A',
    calendarName: 'Standard',
    primaryConstraint: '',
    secondaryConstraint: '',
    isCritical: taskCode === 'A200',
    percentComplete: taskCode === 'A100' ? 45 : 0,
    startVarianceDays: null,
    finishVarianceDays: null,
    deleteFlag: false,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  };
}

const baseActivities: IScheduleActivity[] = [
  activity(1, 'A100', '2026-03-02T00:00:00.000Z', '2026-03-07T00:00:00.000Z'),
  activity(2, 'A200', '2026-03-08T00:00:00.000Z', '2026-03-13T00:00:00.000Z', ['A100']),
  activity(3, 'A300', '2026-03-14T00:00:00.000Z', '2026-03-20T00:00:00.000Z', ['A200']),
];

const meta: Meta<typeof InteractiveGanttV2> = {
  title: 'Pages/Project/InteractiveGanttV2',
  component: InteractiveGanttV2,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof InteractiveGanttV2>;

export const Default: Story = {
  render: () => {
    const [fieldReadiness, setFieldReadiness] = React.useState({
      projectCode: 'P-001',
      score: 82,
      linkageCoveragePct: 91,
      ppcProxy: 78,
      openConstraintPenalty: 7,
      openPermitPenalty: 3,
      computedAt: new Date().toISOString(),
    });

    return (
      <InteractiveGanttV2
        projectCode="P-001"
        activities={baseActivities}
        fieldReadiness={fieldReadiness}
        onFieldReadinessRefresh={() => {
          setFieldReadiness(prev => ({
            ...prev,
            computedAt: new Date().toISOString(),
          }));
        }}
      />
    );
  },
};
