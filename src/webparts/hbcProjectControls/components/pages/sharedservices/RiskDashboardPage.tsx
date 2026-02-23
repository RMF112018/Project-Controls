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
    label: 'Knowledge Center',
    description: 'Insurance policies, coverage guides, and compliance resources.',
    path: '/shared-services/risk/knowledge-center',
  },
  {
    label: 'Requests',
    description: 'COI requests, subcontractor enrollment, and license renewals.',
    path: '/shared-services/risk/requests',
  },
  {
    label: 'Enrollment Tracking',
    description: 'Track subcontractor insurance enrollment and compliance status.',
    path: '/shared-services/risk/enrollment',
  },
  {
    label: 'Documents',
    description: 'Risk management policies and insurance documents.',
    path: '/shared-services/risk/documents',
  },
];

export const RiskDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Risk Management" subtitle="Insurance, compliance, COI requests, and enrollment tracking." />
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
