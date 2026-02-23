import * as React from 'react';
import { Input, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcField } from '../../shared/HbcField';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import type { IActiveProject } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  form: {
    display: 'grid',
    ...shorthands.gap('16px'),
    maxWidth: '600px',
  },
  fieldGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '0', '0', '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
});

export const ProjectSettingsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [project, setProject] = React.useState<IActiveProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [projectName, setProjectName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [division, setDivision] = React.useState('');
  const [sector, setSector] = React.useState('');

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getActiveProjects()
      .then(projects => {
        const found = projects.find(p => p.projectCode === projectCode) || null;
        setProject(found);
        if (found) {
          setProjectName(found.projectName);
          setAddress(found.region || '');
          setStartDate(found.schedule.startDate || '');
          setEndDate(found.schedule.substantialCompletionDate || '');
          setDivision(found.sector);
          setSector(found.sector);
        }
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleSave = React.useCallback(async (): Promise<void> => {
    if (!project) return;

    setSaving(true);
    try {
      await dataService.updateActiveProject(project.id, {
        projectName,
        region: address,
        sector: sector as IActiveProject['sector'],
      });
      addToast('Project settings saved successfully.', 'success');
    } catch {
      addToast('Failed to save project settings.', 'error');
    } finally {
      setSaving(false);
    }
  }, [dataService, project, projectName, address, sector, addToast]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Project Settings" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Project Settings" />
        <HbcSkeleton variant="form" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Project Settings" subtitle={project?.projectName} />

      <div className={styles.form}>
        <HbcField label="Project Name">
          <Input
            value={projectName}
            onChange={(_e, data) => setProjectName(data.value)}
          />
        </HbcField>

        <HbcField label="Project Code">
          <Input value={projectCode} disabled />
        </HbcField>

        <HbcField label="Address">
          <Input
            value={address}
            onChange={(_e, data) => setAddress(data.value)}
          />
        </HbcField>

        <div className={styles.fieldGroup}>
          <HbcField label="Start Date">
            <Input
              value={startDate}
              onChange={(_e, data) => setStartDate(data.value)}
            />
          </HbcField>

          <HbcField label="End Date">
            <Input
              value={endDate}
              onChange={(_e, data) => setEndDate(data.value)}
            />
          </HbcField>
        </div>

        <div className={styles.fieldGroup}>
          <HbcField label="Division">
            <Input
              value={division}
              onChange={(_e, data) => setDivision(data.value)}
            />
          </HbcField>

          <HbcField label="Sector">
            <Input
              value={sector}
              onChange={(_e, data) => setSector(data.value)}
            />
          </HbcField>
        </div>

        <div className={styles.actions}>
          <HbcButton
            emphasis="strong"
            onClick={handleSave}
            isLoading={saving}
          >
            Save Settings
          </HbcButton>
        </div>
      </div>
    </div>
  );
};
