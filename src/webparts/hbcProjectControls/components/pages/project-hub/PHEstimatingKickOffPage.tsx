import * as React from 'react';
import { makeStyles, shorthands, tokens, Checkbox } from '@fluentui/react-components';
import type { ProjectHubKickoffChecklistItem as IChecklistItem } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const INITIAL_CHECKLIST: IChecklistItem[] = [
  { id: 'doc-1', label: 'Bid Documents Received', description: 'All drawings, specifications, and addenda received and logged', category: 'Documents', checked: true },
  { id: 'doc-2', label: 'Plan Review Complete', description: 'Plans reviewed for completeness and conflicts', category: 'Documents', checked: true },
  { id: 'doc-3', label: 'Geotechnical Report', description: 'Geotech report reviewed and soil conditions noted', category: 'Documents', checked: false },
  { id: 'team-1', label: 'Estimator Assigned', description: 'Lead estimator and support estimators assigned', category: 'Team', checked: true },
  { id: 'team-2', label: 'Pre-Bid Walkthrough Scheduled', description: 'Site visit date confirmed with client', category: 'Team', checked: false },
  { id: 'team-3', label: 'Subcontractor Outreach', description: 'Invitations sent to qualified subcontractors', category: 'Team', checked: false },
  { id: 'scope-1', label: 'Scope of Work Defined', description: 'Work breakdown structure established', category: 'Scope', checked: true },
  { id: 'scope-2', label: 'Exclusions Identified', description: 'Out-of-scope items clearly documented', category: 'Scope', checked: false },
  { id: 'scope-3', label: 'Alternates Listed', description: 'All bid alternates identified and priced separately', category: 'Scope', checked: false },
  { id: 'sched-1', label: 'Bid Deadline Confirmed', description: 'Submission date and time verified', category: 'Schedule', checked: true },
  { id: 'sched-2', label: 'Preliminary Schedule', description: 'High-level construction schedule drafted', category: 'Schedule', checked: false },
  { id: 'sched-3', label: 'Milestone Review', description: 'Key milestones aligned with client expectations', category: 'Schedule', checked: false },
];

const categoryOrder: IChecklistItem['category'][] = ['Documents', 'Team', 'Scope', 'Schedule'];

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
    ...shorthands.padding('10px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  checklistContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flexGrow: 1,
  },
  checklistLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  checklistLabelDone: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textDecorationLine: 'line-through',
  },
  checklistDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const PHEstimatingKickOffPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const [checklist, setChecklist] = React.useState<IChecklistItem[]>(INITIAL_CHECKLIST);

  const handleToggle = React.useCallback((id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Estimating Kick-Off" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the Estimating Kick-Off checklist."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';
  const completedCount = checklist.filter(i => i.checked).length;
  const totalCount = checklist.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  const groupedByCategory = React.useMemo(() => {
    const groups: Record<string, IChecklistItem[]> = {};
    for (const cat of categoryOrder) {
      groups[cat] = checklist.filter(item => item.category === cat);
    }
    return groups;
  }, [checklist]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Estimating Kick-Off"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Completion" value={`${completionPct}%`} subtitle={`${completedCount} of ${totalCount} items`} />
        <KPICard title="Documents" value={`${checklist.filter(i => i.category === 'Documents' && i.checked).length}/${checklist.filter(i => i.category === 'Documents').length}`} />
        <KPICard title="Team Readiness" value={`${checklist.filter(i => i.category === 'Team' && i.checked).length}/${checklist.filter(i => i.category === 'Team').length}`} />
        <KPICard title="Scope Items" value={`${checklist.filter(i => i.category === 'Scope' && i.checked).length}/${checklist.filter(i => i.category === 'Scope').length}`} />
      </div>

      {categoryOrder.map(category => {
        const items = groupedByCategory[category] || [];
        const catComplete = items.filter(i => i.checked).length;
        const catTotal = items.length;
        const badgeColors = catComplete === catTotal
          ? { color: HBC_COLORS.success, backgroundColor: HBC_COLORS.successLight }
          : { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight };

        return (
          <HbcCard
            key={category}
            title={category}
            headerActions={
              <StatusBadge
                label={`${catComplete}/${catTotal}`}
                color={badgeColors.color}
                backgroundColor={badgeColors.backgroundColor}
                size="medium"
              />
            }
          >
            {items.map(item => (
              <div key={item.id} className={styles.checklistItem}>
                <Checkbox
                  checked={item.checked}
                  onChange={() => handleToggle(item.id)}
                  aria-label={item.label}
                />
                <div className={styles.checklistContent}>
                  <span className={item.checked ? styles.checklistLabelDone : styles.checklistLabel}>
                    {item.label}
                  </span>
                  <span className={styles.checklistDescription}>{item.description}</span>
                </div>
              </div>
            ))}
          </HbcCard>
        );
      })}
    </div>
  );
};
