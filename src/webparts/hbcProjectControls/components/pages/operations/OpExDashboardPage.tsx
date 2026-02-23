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

const TILES = [
  {
    label: 'Onboarding',
    description: 'New employee onboarding checklists and orientation tracking.',
    path: '/operations/opex/onboarding',
  },
  {
    label: 'Training',
    description: 'Training programs, certifications, and compliance tracking.',
    path: '/operations/opex/training',
  },
  {
    label: 'Documents',
    description: 'Operational excellence documentation and resources.',
    path: '/operations/opex/documents',
  },
];

export const OpExDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Operational Excellence" />
      <div className={styles.grid}>
        {TILES.map(tile => (
          <HbcCard
            key={tile.path}
            title={tile.label}
            interactive
            onClick={() => navigate(tile.path)}
          >
            <span className={styles.tileDescription}>{tile.description}</span>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
