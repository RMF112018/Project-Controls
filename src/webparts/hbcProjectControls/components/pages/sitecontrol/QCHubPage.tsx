import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  hubDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('0'),
  },
});

const CARDS = [
  {
    label: 'Inspections',
    description: 'Interactive QC inspection forms with checklist and photo documentation.',
    path: '/site-control/qc/inspections',
  },
  {
    label: 'Issue Resolution',
    description: 'Five-bucket workflow for tracking and resolving quality issues.',
    path: '/site-control/qc/issues',
  },
  {
    label: 'Metrics',
    description: 'QC performance dashboards, pass/fail rates, and trend analysis.',
    path: '/site-control/qc/metrics',
  },
  {
    label: 'Documents',
    description: 'Quality control documents, standards, and reference materials.',
    path: '/site-control/qc/documents',
  },
];

export const QCHubPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Quality Control Dashboard" subtitle="QC inspections, issue resolution, and performance metrics." />
      <div className={styles.grid}>
        {CARDS.map(card => (
          <HbcCard key={card.path} title={card.label} interactive onClick={() => navigate(card.path)}>
            <p className={styles.hubDescription}>{card.description}</p>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
