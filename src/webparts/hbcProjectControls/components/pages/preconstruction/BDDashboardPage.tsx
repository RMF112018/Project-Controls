import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { Stage, isActiveStage } from '@hbc/sp-services';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
});

const BDDashboardPageInner: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['bd-leads'],
    queryFn: () => dataService.getLeads(),
    staleTime: 5 * 60_000,
  });

  const leads = data?.items ?? [];
  const activeLeads = leads.filter(l => isActiveStage(l.Stage));
  const pursuits = leads.filter(l => l.Stage === Stage.Pursuit);
  const opportunities = leads.filter(l => l.Stage === Stage.Opportunity);
  const wonPending = leads.filter(l => l.Stage === Stage.WonContractPending);

  return (
    <div>
      <PageHeader title="Business Development Dashboard" />
      {loading ? <HbcSkeleton variant="kpi-grid" columns={4} /> : (
        <div className={styles.kpiGrid} role="region" aria-label="Business development key metrics">
          <KPICard title="Active Leads" value={activeLeads.length} />
          <KPICard title="Pursuits" value={pursuits.length} />
          <KPICard title="Opportunities" value={opportunities.length} />
          <KPICard title="Won (Contract Pending)" value={wonPending.length} />
        </div>
      )}
    </div>
  );
};

export const BDDashboardPage = React.memo(BDDashboardPageInner);
