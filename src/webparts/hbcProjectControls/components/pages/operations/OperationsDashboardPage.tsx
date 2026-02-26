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

const SUB_HUBS = [
  {
    label: 'Commercial Operations',
    description: 'Project tracking, buyout logs, permits, constraints, and financial forecasting.',
    path: '/operations/commercial',
  },
  {
    label: 'Operational Excellence',
    description: 'Onboarding, training, and operational excellence documentation.',
    path: '/operations/opex',
  },
  {
    label: 'Safety',
    description: 'Safety training, certification, scorecard, and resources.',
    path: '/operations/safety',
  },
  {
    label: 'Quality Control & Warranty',
    description: 'Best practices, QA tracking, checklists, and warranty management.',
    path: '/operations/qc',
  },
];

export const OperationsDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Operations" />
      <div className={styles.grid}>
        {SUB_HUBS.map(hub => (
          <HbcCard key={hub.path} title={hub.label} interactive onClick={() => navigate(hub.path)}>
            <p className={styles.hubDescription}>{hub.description}</p>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
