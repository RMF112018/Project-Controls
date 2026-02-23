import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { Stage, isActiveStage } from '@hbc/sp-services';
import type { ILead } from '@hbc/sp-services';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
});

export const BDDashboardPage: React.FC = () => {
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
  const pursuits = leads.filter(l => l.Stage === Stage.Pursuit);
  const opportunities = leads.filter(l => l.Stage === Stage.Opportunity);
  const wonPending = leads.filter(l => l.Stage === Stage.WonContractPending);

  return (
    <div>
      <PageHeader title="Business Development Dashboard" />
      {loading ? <HbcSkeleton variant="kpi-grid" columns={4} /> : <div className={styles.kpiGrid}>
        <KPICard title="Active Leads" value={activeLeads.length} />
        <KPICard title="Pursuits" value={pursuits.length} />
        <KPICard title="Opportunities" value={opportunities.length} />
        <KPICard title="Won (Contract Pending)" value={wonPending.length} />
      </div>}
    </div>
  );
};
