import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { HBC_COLORS } from '../../../theme/tokens';

interface IManualTile {
  title: string;
  description: string;
  route: string;
}

const MANUAL_TILES: IManualTile[] = [
  {
    title: 'Project Management Plan',
    description: 'Comprehensive project execution strategy and approval workflow.',
    route: '/operations/project/manual/pmp',
  },
  {
    title: "Superintendent's Plan",
    description: 'Field operations plan and section management.',
    route: '/operations/project/manual/superintendent',
  },
  {
    title: 'Responsibility Matrix',
    description: 'Internal, owner contract, and sub-contract matrices.',
    route: '/operations/project/manual/responsibility',
  },
  {
    title: 'Startup & Closeout',
    description: 'Project startup checklist and closeout procedures.',
    route: '/operations/project/manual/startup',
  },
  {
    title: 'Meeting Agenda Templates',
    description: 'Standard meeting formats and agenda items.',
    route: '/operations/project/manual/meetings',
  },
  {
    title: 'Pay Application Process',
    description: 'Payment application workflow and deliverables.',
    route: '/operations/project/manual/pay-app',
  },
  {
    title: 'Safety Plan',
    description: 'Project-specific safety requirements.',
    route: '/operations/project/manual/safety-plan',
  },
  {
    title: 'OSHA Site Visit Guide',
    description: 'OSHA inspection preparation and compliance.',
    route: '/operations/project/manual/osha',
  },
  {
    title: 'Tropical Weather Guide',
    description: 'Hurricane and tropical weather preparedness.',
    route: '/operations/project/manual/weather',
  },
  {
    title: 'Crisis Management & ICE',
    description: 'Emergency procedures and contact information.',
    route: '/operations/project/manual/crisis',
  },
  {
    title: 'QA/QC Program',
    description: 'Quality assurance and control program overview.',
    route: '/operations/project/manual/qaqc',
  },
  {
    title: 'IDS Requirements',
    description: 'Innovation and digital services project requirements.',
    route: '/operations/project/manual/ids',
  },
];

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
  },
  tileDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  tileTitle: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export const ProjectManualPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const navigate = useAppNavigate();

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Project Manual" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Manual"
        subtitle={selectedProject?.projectName}
      />

      <div className={styles.grid}>
        {MANUAL_TILES.map(tile => (
          <HbcCard
            key={tile.route}
            title={<span className={styles.tileTitle}>{tile.title}</span>}
            interactive
            onClick={() => navigate(tile.route)}
          >
            <span className={styles.tileDescription}>{tile.description}</span>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
