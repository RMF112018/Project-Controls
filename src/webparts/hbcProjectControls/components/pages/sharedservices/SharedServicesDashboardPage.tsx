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
    label: 'Marketing',
    description: 'Campaign management, resources, requests, and tracking.',
    path: '/shared-services/marketing',
  },
  {
    label: 'Human Resources',
    description: 'People & culture, openings, announcements, and initiatives.',
    path: '/shared-services/hr',
  },
  {
    label: 'Accounting',
    description: 'Project setup, accounts receivable, and financial documents.',
    path: '/shared-services/accounting',
  },
  {
    label: 'Risk Management',
    description: 'Insurance knowledge center, COI requests, and enrollment tracking.',
    path: '/shared-services/risk',
  },
];

export const SharedServicesDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Shared Services" subtitle="Marketing, Human Resources, Accounting, and Risk Management." />
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
