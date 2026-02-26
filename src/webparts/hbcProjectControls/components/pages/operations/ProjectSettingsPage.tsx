import * as React from 'react';
import { Input, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { HbcField } from '../../shared/HbcField';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import type { IActiveProject } from '@hbc/sp-services';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { qk } from '../../../tanstack/query/queryKeys';
import { activeProjectsOptions } from '../../../tanstack/query/queryOptions/operations';

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
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [projectName, setProjectName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [division, setDivision] = React.useState('');
  const [sector, setSector] = React.useState('');

  const projectsQuery = useQuery(activeProjectsOptions(scope, dataService));
  const project = React.useMemo(
    () => (projectsQuery.data ?? []).find((item) => item.projectCode === projectCode) ?? null,
    [projectsQuery.data, projectCode]
  );

  React.useEffect(() => {
    if (!project) {
      return;
    }
    setProjectName(project.projectName);
    setAddress(project.region || '');
    setStartDate(project.schedule.startDate || '');
    setEndDate(project.schedule.substantialCompletionDate || '');
    setDivision(project.sector);
    setSector(project.sector);
  }, [project]);

  const updateProjectMutation = useMutation<IActiveProject, Error, { id: number; data: Partial<IActiveProject> }, { snapshots: Array<[ReadonlyArray<unknown>, unknown]> }>({
    mutationFn: async ({ id, data }) => dataService.updateActiveProject(id, data),
    onMutate: async ({ id, data }) => {
      const queryKey = qk.activeProjects.base(scope);
      await queryClient.cancelQueries({ queryKey });

      const snapshots = queryClient.getQueriesData<unknown>({ queryKey });

      queryClient.setQueriesData<IActiveProject[]>(
        { queryKey },
        (previous = []) => previous.map((item) => (
          item.id === id
            ? {
                ...item,
                ...data,
              }
            : item
        ))
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
      addToast('Failed to save project settings.', 'error');
    },
    onSuccess: () => {
      addToast('Project settings saved successfully.', 'success');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.activeProjects.base(scope) });
    },
  });

  const handleSave = React.useCallback(async (): Promise<void> => {
    if (!project) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          projectName,
          region: address,
          sector: sector as IActiveProject['sector'],
        },
      });
    } catch {
      // Error toast handled in mutation onError.
    }
  }, [project, projectName, address, sector, updateProjectMutation]);

  const loading = !!projectCode && projectsQuery.isLoading;
  const saving = updateProjectMutation.isPending;

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
