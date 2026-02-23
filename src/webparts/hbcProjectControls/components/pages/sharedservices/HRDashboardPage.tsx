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
    label: 'Openings',
    description: 'Current job openings and recruitment pipeline.',
    path: '/shared-services/hr/openings',
  },
  {
    label: 'Announcements',
    description: 'Birthdays, anniversaries, promotions, and company news.',
    path: '/shared-services/hr/announcements',
  },
  {
    label: 'Initiatives',
    description: 'Active HR programs, training initiatives, and wellness.',
    path: '/shared-services/hr/initiatives',
  },
  {
    label: 'Documents',
    description: 'HR policies, handbooks, and forms.',
    path: '/shared-services/hr/documents',
  },
];

export const HRDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="People & Culture" subtitle="Human resources, openings, and company culture." />
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
