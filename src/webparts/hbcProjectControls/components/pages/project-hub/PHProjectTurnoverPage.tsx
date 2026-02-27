import * as React from 'react';
import { makeStyles, shorthands, tokens, Checkbox, ProgressBar } from '@fluentui/react-components';
import type {
  ITurnoverSection,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const INITIAL_SECTIONS: ITurnoverSection[] = [
  {
    id: 'contract',
    title: 'Contract & Legal',
    items: [
      { id: 'c-1', label: 'Executed Contract', description: 'Signed contract with all amendments filed', checked: true, responsible: 'BD' },
      { id: 'c-2', label: 'Insurance Certificates', description: 'All required insurance certificates on file', checked: true, responsible: 'BD' },
      { id: 'c-3', label: 'Bonding Documentation', description: 'Performance and payment bonds executed', checked: false, responsible: 'BD' },
      { id: 'c-4', label: 'Permits & Approvals', description: 'Building permits, zoning, and jurisdictional approvals', checked: false, responsible: 'PM' },
    ],
  },
  {
    id: 'estimate',
    title: 'Estimate & Budget',
    items: [
      { id: 'e-1', label: 'Final Estimate Package', description: 'Complete estimate with all backup documentation', checked: true, responsible: 'Estimating' },
      { id: 'e-2', label: 'Budget Transfer', description: 'Estimate transferred to project budget system', checked: false, responsible: 'Estimating' },
      { id: 'e-3', label: 'Subcontractor Bid Summary', description: 'All sub bids with scope comparison', checked: true, responsible: 'Estimating' },
      { id: 'e-4', label: 'Buyout Log Initialized', description: 'Trade packages identified for buyout', checked: false, responsible: 'PM' },
      { id: 'e-5', label: 'Value Engineering Log', description: 'VE items documented and owner-approved', checked: false, responsible: 'Estimating' },
    ],
  },
  {
    id: 'schedule',
    title: 'Schedule & Logistics',
    items: [
      { id: 's-1', label: 'Baseline Schedule', description: 'CPM schedule approved and baselined', checked: false, responsible: 'Superintendent' },
      { id: 's-2', label: 'Site Logistics Plan', description: 'Traffic, staging, crane, and laydown areas defined', checked: false, responsible: 'Superintendent' },
      { id: 's-3', label: 'Procurement Log', description: 'Long-lead items identified with expected delivery dates', checked: false, responsible: 'PM' },
    ],
  },
  {
    id: 'team',
    title: 'Team & Communication',
    items: [
      { id: 't-1', label: 'Project Team Assigned', description: 'PM, Superintendent, PE, and support staff confirmed', checked: true, responsible: 'PM' },
      { id: 't-2', label: 'Kickoff Meeting Held', description: 'Internal kickoff with full project team', checked: false, responsible: 'PM' },
      { id: 't-3', label: 'Client Contact Sheet', description: 'Owner, architect, and consultant contacts distributed', checked: true, responsible: 'BD' },
      { id: 't-4', label: 'SharePoint Site Provisioned', description: 'Project site created with standard folder structure', checked: false, responsible: 'PM' },
    ],
  },
];

const responsibleColors: Record<string, { color: string; backgroundColor: string }> = {
  Estimating: { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
  BD: { color: '#7C3AED', backgroundColor: '#EDE9FE' },
  PM: { color: HBC_COLORS.navy, backgroundColor: '#E0E7FF' },
  Superintendent: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
};

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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  progressRow: {
    marginBottom: '12px',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
    ...shorthands.padding('10px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flexGrow: 1,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  itemLabelDone: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const PHProjectTurnoverPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const [sections, setSections] = React.useState<ITurnoverSection[]>(INITIAL_SECTIONS);

  const handleToggle = React.useCallback((sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          }
        : section
    ));
  }, []);

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Project Turnover" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the Project Turnover checklist."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';
  const allItems = sections.flatMap(s => s.items);
  const completedCount = allItems.filter(i => i.checked).length;
  const totalCount = allItems.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Turnover"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Overall Completion" value={`${completionPct}%`} subtitle={`${completedCount} of ${totalCount} items`} />
        <KPICard title="Estimating Items" value={`${allItems.filter(i => i.responsible === 'Estimating' && i.checked).length}/${allItems.filter(i => i.responsible === 'Estimating').length}`} />
        <KPICard title="PM Items" value={`${allItems.filter(i => i.responsible === 'PM' && i.checked).length}/${allItems.filter(i => i.responsible === 'PM').length}`} />
        <KPICard title="Target Date" value="TBD" subtitle="Set after contract execution" />
      </div>

      {sections.map(section => {
        const sectionComplete = section.items.filter(i => i.checked).length;
        const sectionTotal = section.items.length;
        const sectionPct = sectionTotal > 0 ? sectionComplete / sectionTotal : 0;

        return (
          <HbcCard
            key={section.id}
            title={section.title}
            headerActions={
              <StatusBadge
                label={`${sectionComplete}/${sectionTotal}`}
                color={sectionComplete === sectionTotal ? HBC_COLORS.success : HBC_COLORS.warning}
                backgroundColor={sectionComplete === sectionTotal ? HBC_COLORS.successLight : HBC_COLORS.warningLight}
                size="medium"
              />
            }
          >
            <div className={styles.progressRow}>
              <ProgressBar value={sectionPct} thickness="large" color={sectionComplete === sectionTotal ? 'success' : 'brand'} />
            </div>
            {section.items.map(item => {
              const respColors = responsibleColors[item.responsible] || responsibleColors.PM;
              return (
                <div key={item.id} className={styles.checklistItem}>
                  <Checkbox
                    checked={item.checked}
                    onChange={() => handleToggle(section.id, item.id)}
                    aria-label={item.label}
                  />
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={item.checked ? styles.itemLabelDone : styles.itemLabel}>
                        {item.label}
                      </span>
                      <StatusBadge label={item.responsible} color={respColors.color} backgroundColor={respColors.backgroundColor} />
                    </div>
                    <span className={styles.itemDescription}>{item.description}</span>
                  </div>
                </div>
              );
            })}
          </HbcCard>
        );
      })}
    </div>
  );
};
