import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { HbcEChart } from '../../shared/HbcEChart';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { Stage, getStageLabel, isActiveStage } from '@hbc/sp-services';
import type { ILead } from '@hbc/sp-services';
import { useHbcChartColors } from '../../hooks/useHbcChartColors';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalSNudge),
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  chartContainer: {
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
});

const STAGE_ORDER = [
  Stage.Opportunity,
  Stage.Pursuit,
  Stage.WonContractPending,
  Stage.ActiveConstruction,
  Stage.Closeout,
];

const PipelinePageInner: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const chartColors = useHbcChartColors();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: () => dataService.getLeads(),
    staleTime: 5 * 60_000,
  });

  const leads = data?.items ?? [];
  const activeLeads = leads.filter(l => isActiveStage(l.Stage));
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);

  const chartOption = React.useMemo(() => {
    const stageCounts = STAGE_ORDER.map(stage => ({
      name: getStageLabel(stage),
      value: leads.filter(l => l.Stage === stage).length,
    }));

    return {
      tooltip: { trigger: 'item' as const },
      series: [{
        type: 'funnel' as const,
        data: stageCounts,
        label: { show: true, position: 'inside' as const },
        itemStyle: {
          borderWidth: 1,
          borderColor: chartColors.chartBackground,
        },
      }],
      color: [chartColors.muted, chartColors.info, chartColors.warning, chartColors.success, chartColors.primary],
    };
  }, [leads, chartColors]);

  return (
    <div>
      <PageHeader title="Pipeline" />
      {loading ? <HbcSkeleton variant="kpi-grid" columns={2} /> : (
        <div className={styles.kpiGrid} role="region" aria-label="Pipeline summary">
          <KPICard title="Active Leads" value={activeLeads.length} />
          <KPICard title="Total Pipeline Value" value={`$${(totalValue / 1_000_000).toFixed(1)}M`} />
        </div>
      )}
      {loading ? <HbcSkeleton variant="card" /> : (
        <div className={styles.chartContainer}>
          <HbcEChart option={chartOption} height={400} ariaLabel="Pipeline funnel chart by stage" />
        </div>
      )}
    </div>
  );
};

export const PipelinePage = React.memo(PipelinePageInner);
