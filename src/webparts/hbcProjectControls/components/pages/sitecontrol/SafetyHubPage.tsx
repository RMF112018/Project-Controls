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
    description: 'Template-based safety inspection forms with photo capture.',
    path: '/site-control/safety/inspections',
  },
  {
    label: 'Warnings & Notices',
    description: 'Issue, track, and resolve safety warnings and violation notices.',
    path: '/site-control/safety/warnings',
  },
  {
    label: 'Tool-Box Talks',
    description: 'Daily tool-box talk topics, attendance tracking, and recommendations.',
    path: '/site-control/safety/toolbox-talks',
  },
  {
    label: 'Scorecard',
    description: 'Aggregated safety metrics, trends, and project safety scores.',
    path: '/site-control/safety/scorecard',
  },
  {
    label: 'Documents',
    description: 'Safety program documents, policies, SOPs, and training materials.',
    path: '/site-control/safety/documents',
  },
];

export const SafetyHubPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Safety Dashboard" subtitle="Safety inspections, warnings, tool-box talks, and performance scorecards." />
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
