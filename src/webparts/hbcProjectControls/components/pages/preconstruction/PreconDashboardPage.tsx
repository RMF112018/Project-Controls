import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  hubLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    ...shorthands.margin('0', '0', '4px'),
  },
  hubDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('0'),
  },
});

const SUB_HUBS = [
  {
    label: 'Business Development',
    description: 'Lead management, Go/No-Go scoring, pipeline tracking, and BD project oversight.',
    path: '/preconstruction/bd',
  },
  {
    label: 'Estimating',
    description: 'Department tracking, job number requests, post-bid autopsies, and estimating project hub.',
    path: '/preconstruction/estimating',
  },
  {
    label: 'Innovation & Digital Services',
    description: 'IDS project tracking, digital transformation initiatives, and documentation.',
    path: '/preconstruction/ids',
  },
];

export const PreconDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Preconstruction" />
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
