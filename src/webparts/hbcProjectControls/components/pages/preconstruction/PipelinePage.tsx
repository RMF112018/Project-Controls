import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcEChart } from '../../shared/HbcEChart';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { Stage, getStageLabel, isActiveStage } from '@hbc/sp-services';
import type { ILead } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '0'),
  },
  chartContainer: {
    ...shorthands.padding('16px', '0'),
  },
});

const STAGE_ORDER = [
  Stage.Opportunity,
  Stage.Pursuit,
  Stage.WonContractPending,
  Stage.ActiveConstruction,
  Stage.Closeout,
];

export const PipelinePage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getLeads()
      .then(result => setLeads(result.items))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [dataService]);

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
          borderColor: '#fff',
        },
      }],
      color: [HBC_COLORS.gray400, HBC_COLORS.info, HBC_COLORS.warning, HBC_COLORS.success, HBC_COLORS.navy],
    };
  }, [leads]);

  return (
    <div>
      <PageHeader title="Pipeline" />
      {loading ? <HbcSkeleton variant="kpi-grid" columns={2} /> : <div className={styles.kpiGrid}>
        <KPICard title="Active Leads" value={activeLeads.length} />
        <KPICard title="Total Pipeline Value" value={`$${(totalValue / 1_000_000).toFixed(1)}M`} />
      </div>}
      {loading ? <HbcSkeleton variant="card" /> : <div className={styles.chartContainer}>
        <HbcEChart option={chartOption} height={400} />
      </div>}
    </div>
  );
};
