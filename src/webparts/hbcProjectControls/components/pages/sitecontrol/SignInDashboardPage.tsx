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
    label: 'Sign-In / Sign-Out Scanner',
    description: 'QR code scanning for jobsite personnel check-in and check-out.',
    path: '/site-control/signin',
  },
  {
    label: 'Personnel Log',
    description: 'View and manage daily sign-in/out records for all personnel.',
    path: '/site-control/signin/log',
  },
  {
    label: 'Documents',
    description: 'Jobsite management documents, policies, and forms.',
    path: '/site-control/signin/documents',
  },
];

export const SignInDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Jobsite Management" subtitle="Personnel sign-in/out, tracking, and jobsite documentation." />
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
