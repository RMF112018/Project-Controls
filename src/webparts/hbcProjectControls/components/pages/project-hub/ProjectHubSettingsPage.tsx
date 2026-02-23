import * as React from 'react';
import { makeStyles, shorthands, tokens, Input, Label } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  readOnlyValue: {
    ...shorthands.padding('6px', '12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('4px'),
    fontSize: tokens.fontSizeBase300,
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export const ProjectHubSettingsPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Project Settings" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view Project Settings."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Settings"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <HbcCard title="General Information">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label weight="semibold">Project Code</Label>
            <div className={styles.readOnlyValue}>{projectCode}</div>
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Project Name</Label>
            <Input value={projectName} readOnly appearance="filled-darker" />
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Client</Label>
            <Input value={selectedProject.clientName || ''} readOnly appearance="filled-darker" />
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Region</Label>
            <Input value={selectedProject.region || ''} readOnly appearance="filled-darker" />
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Division</Label>
            <Input value={selectedProject.division || ''} readOnly appearance="filled-darker" />
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Stage</Label>
            <Input value={selectedProject.stage || ''} readOnly appearance="filled-darker" />
          </div>
        </div>
      </HbcCard>

      <HbcCard title="Site Configuration">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label weight="semibold">SharePoint Site URL</Label>
            <Input value={selectedProject.siteUrl || 'Not configured'} readOnly appearance="filled-darker" />
          </div>
          <div className={styles.field}>
            <Label weight="semibold">Project Value</Label>
            <Input
              value={selectedProject.projectValue ? `$${selectedProject.projectValue.toLocaleString()}` : '\u2014'}
              readOnly
              appearance="filled-darker"
            />
          </div>
        </div>
      </HbcCard>
    </div>
  );
};
