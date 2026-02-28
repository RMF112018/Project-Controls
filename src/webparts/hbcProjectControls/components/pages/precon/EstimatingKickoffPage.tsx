/**
 * Stage 8 — EstimatingKickoffPage: Full config-driven Estimating Kickoff form.
 *
 * Renders all 5 Excel sections via <KickOffSection /> using ALL_KICKOFF_SECTION_CONFIGS
 * from @hbc/sp-services (single source of truth). Backed by TanStack Query with
 * optimistic updates for inline editing.
 *
 * 100% row + column fidelity with reference/Estimating Kickoff Template.xlsx.
 */
import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import {
  ALL_KICKOFF_SECTION_CONFIGS,
  PERMISSIONS,
  type EstimatingKickoffSection,
  type IEstimatingKickoff,
  type IEstimatingKickoffItem,
} from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KickOffSection } from '../../shared/KickOffSection';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { qk } from '../../../tanstack/query/queryKeys';
import { kickoffByProjectOptions } from '../../../tanstack/query/queryOptions/kickoffQueryOptions';

// ── Styles ─────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalL),
    maxWidth: '1200px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('16px'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray200),
  },
  kpiLabel: {
    fontSize: tokens.fontSizeBase200,
    color: HBC_COLORS.gray500,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: HBC_COLORS.navy,
  },
});

// ── KPI Helpers ────────────────────────────────────────────────────────
interface IKickoffKpi {
  label: string;
  value: string;
}

function computeKpis(items: IEstimatingKickoffItem[]): IKickoffKpi[] {
  const managing = items.filter(i => i.section === 'managing');
  const deliverables = items.filter(
    i => i.section === 'deliverables_standard' || i.section === 'deliverables_nonstandard',
  );
  const keyDates = items.filter(i => i.section === 'key_dates');

  const statusSet = items.filter(i => i.status !== null);
  const managingDone = managing.filter(i => i.status === 'yes');
  const deliverablesReady = deliverables.filter(i => i.status === 'yes');
  const datesSet = keyDates.filter(i => i.deadline);

  return [
    {
      label: 'Overall Completion',
      value: items.length > 0 ? `${Math.round((statusSet.length / items.length) * 100)}%` : '0%',
    },
    {
      label: 'Managing Progress',
      value: managing.length > 0 ? `${managingDone.length}/${managing.length}` : '0/0',
    },
    {
      label: 'Deliverables Ready',
      value: deliverables.length > 0 ? `${deliverablesReady.length}/${deliverables.length}` : '0/0',
    },
    {
      label: 'Key Dates Set',
      value: keyDates.length > 0 ? `${datesSet.length}/${keyDates.length}` : '0/0',
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────
export const EstimatingKickoffPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser, hasPermission } = useAppContext();
  const { selectedProject } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const navigate = useAppNavigate();

  // Stage 9: Read projectCode from search params (cross-workspace nav) with context fallback.
  const searchParams = useSearch({ strict: false }) as { projectCode?: string; leadId?: number };
  const projectCode = searchParams.projectCode || selectedProject?.projectCode || '';
  const canEdit = hasPermission(PERMISSIONS.ESTIMATING_EDIT);

  // Stage 9: Breadcrumb items — Estimating Tracker → Estimating Kick-Off
  const breadcrumbItems = React.useMemo(() => [
    { label: 'Estimating Tracker', path: '/preconstruction/estimating/tracking' },
    { label: 'Estimating Kick-Off', path: '' },
  ], []);

  // ── Data fetch ─────────────────────────────────────────────────────
  const { data: kickoff, isLoading } = useQuery(
    kickoffByProjectOptions(scope, projectCode, dataService),
  );

  // ── Auto-create kickoff if none exists ─────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: Partial<IEstimatingKickoff>) =>
      dataService.createEstimatingKickoff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.kickoff.base(scope) });
    },
  });

  React.useEffect(() => {
    if (!isLoading && !kickoff && projectCode && !createMutation.isPending) {
      createMutation.mutate({
        ProjectCode: projectCode,
        CreatedBy: currentUser?.email ?? 'system',
      });
    }
  }, [isLoading, kickoff, projectCode, createMutation, currentUser?.email]);

  // ── Update item mutation (optimistic) ──────────────────────────────
  const updateItemMutation = useMutation({
    mutationFn: ({ kickoffId, itemId, data }: {
      kickoffId: number;
      itemId: number;
      data: Partial<IEstimatingKickoffItem>;
    }) => dataService.updateKickoffItem(kickoffId, itemId, data),
    onMutate: async ({ itemId, data }) => {
      const key = qk.kickoff.byProject(scope, projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IEstimatingKickoff | null>(key);
      if (previous) {
        queryClient.setQueryData<IEstimatingKickoff | null>(key, {
          ...previous,
          items: previous.items.map(i => i.id === itemId ? { ...i, ...data } : i),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          qk.kickoff.byProject(scope, projectCode),
          context.previous,
        );
      }
      addToast('Failed to save change', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.kickoff.byProject(scope, projectCode) });
    },
  });

  // ── Update parent-level fields mutation (optimistic) ───────────────
  const updateKickoffMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IEstimatingKickoff> }) =>
      dataService.updateEstimatingKickoff(id, data),
    onMutate: async ({ data }) => {
      const key = qk.kickoff.byProject(scope, projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IEstimatingKickoff | null>(key);
      if (previous) {
        queryClient.setQueryData<IEstimatingKickoff | null>(key, { ...previous, ...data });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          qk.kickoff.byProject(scope, projectCode),
          context.previous,
        );
      }
      addToast('Failed to save change', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.kickoff.byProject(scope, projectCode) });
    },
  });

  // ── Add custom row mutation ────────────────────────────────────────
  const addItemMutation = useMutation({
    mutationFn: ({ kickoffId, item }: {
      kickoffId: number;
      item: Partial<IEstimatingKickoffItem>;
    }) => dataService.addKickoffItem(kickoffId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.kickoff.byProject(scope, projectCode) });
      addToast('Row added', 'success');
    },
  });

  // ── Remove row mutation ────────────────────────────────────────────
  const removeItemMutation = useMutation({
    mutationFn: ({ kickoffId, itemId }: { kickoffId: number; itemId: number }) =>
      dataService.removeKickoffItem(kickoffId, itemId),
    onMutate: async ({ itemId }) => {
      const key = qk.kickoff.byProject(scope, projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IEstimatingKickoff | null>(key);
      if (previous) {
        queryClient.setQueryData<IEstimatingKickoff | null>(key, {
          ...previous,
          items: previous.items.filter(i => i.id !== itemId),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          qk.kickoff.byProject(scope, projectCode),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.kickoff.byProject(scope, projectCode) });
    },
  });

  // ── Callbacks ──────────────────────────────────────────────────────
  const handleItemUpdate = React.useCallback(
    (itemId: number, field: string, value: unknown) => {
      if (!kickoff) return;
      updateItemMutation.mutate({
        kickoffId: kickoff.id,
        itemId,
        data: { [field]: value } as Partial<IEstimatingKickoffItem>,
      });
    },
    [kickoff, updateItemMutation],
  );

  const handleKickoffUpdate = React.useCallback(
    (field: string, value: unknown) => {
      if (!kickoff) return;
      updateKickoffMutation.mutate({
        id: kickoff.id,
        data: { [field]: value } as Partial<IEstimatingKickoff>,
      });
    },
    [kickoff, updateKickoffMutation],
  );

  const handleAddCustomRow = React.useCallback(
    (section: EstimatingKickoffSection) => {
      if (!kickoff) return;
      const sectionItems = kickoff.items.filter(i => i.section === section);
      addItemMutation.mutate({
        kickoffId: kickoff.id,
        item: {
          section,
          task: '',
          status: null,
          isCustom: true,
          sortOrder: sectionItems.length + 1,
        },
      });
    },
    [kickoff, addItemMutation],
  );

  const handleRemoveRow = React.useCallback(
    (itemId: number) => {
      if (!kickoff) return;
      removeItemMutation.mutate({ kickoffId: kickoff.id, itemId });
    },
    [kickoff, removeItemMutation],
  );

  // ── KPIs ───────────────────────────────────────────────────────────
  const kpis = React.useMemo(
    () => computeKpis(kickoff?.items ?? []),
    [kickoff?.items],
  );

  // ── Render ─────────────────────────────────────────────────────────
  if (!projectCode) {
    return (
      <HbcEmptyState
        title="No Project Selected"
        description="Select a project to view the Estimating Kick-Off form."
      />
    );
  }

  if (isLoading || createMutation.isPending) {
    return <SkeletonLoader variant="table" rows={10} />;
  }

  if (!kickoff) {
    return (
      <HbcEmptyState
        title="Kickoff Not Available"
        description="Unable to load kickoff data for this project."
      />
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Estimating Kick-Off"
        subtitle={`${projectCode} \u2014 ${selectedProject?.projectName ?? ''}`}
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={() => navigate('/preconstruction/estimating/tracking')}
          >
            Back to Tracker
          </Button>
        }
      />

      {/* KPI summary cards */}
      <div className={styles.kpiGrid}>
        {kpis.map(kpi => (
          <div key={kpi.label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiValue}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Config-driven sections — ALL from single source of truth */}
      {ALL_KICKOFF_SECTION_CONFIGS.map(config => (
        <KickOffSection
          key={config.sectionKey}
          config={config}
          items={kickoff.items.filter(i => i.section === config.sectionKey)}
          kickoff={kickoff}
          onItemUpdate={handleItemUpdate}
          onKickoffUpdate={handleKickoffUpdate}
          onAddCustomRow={handleAddCustomRow}
          onRemoveRow={handleRemoveRow}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
};
