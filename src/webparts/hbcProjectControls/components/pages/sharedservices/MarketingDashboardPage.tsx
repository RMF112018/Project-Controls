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
  tileDescription: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground3,
  },
});

const SUB_PAGES = [
  {
    label: 'Resources',
    description: 'Brand assets, templates, and marketing collateral.',
    path: '/shared-services/marketing/resources',
  },
  {
    label: 'Requests',
    description: 'Submit and track marketing requests.',
    path: '/shared-services/marketing/requests',
  },
  {
    label: 'Tracking',
    description: 'Campaign performance and project tracking.',
    path: '/shared-services/marketing/tracking',
  },
  {
    label: 'Documents',
    description: 'Marketing document library.',
    path: '/shared-services/marketing/documents',
  },
];

export const MarketingDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Campaign management, resources, and brand assets." />
      <div className={styles.grid}>
        {SUB_PAGES.map(page => (
          <HbcCard
            key={page.path}
            title={page.label}
            interactive
            onClick={() => navigate(page.path)}
          >
            <span className={styles.tileDescription}>{page.description}</span>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
