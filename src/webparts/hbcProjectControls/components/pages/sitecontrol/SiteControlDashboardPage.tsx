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
    label: 'Jobsite Management',
    description: 'QR sign-in/out, personnel tracking, and jobsite documentation.',
    path: '/site-control/signin',
  },
  {
    label: 'Safety',
    description: 'Safety inspections, warnings & notices, tool-box talks, and scorecards.',
    path: '/site-control/safety',
  },
  {
    label: 'Quality Control',
    description: 'QC inspections, issue resolution workflow, and performance metrics.',
    path: '/site-control/qc',
  },
];

export const SiteControlDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="HB Site Control" subtitle="Mobile-first field management for safety, quality, and jobsite operations." />
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
