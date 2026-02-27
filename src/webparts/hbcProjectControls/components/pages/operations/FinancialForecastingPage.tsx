import * as React from 'react';
import { makeStyles, shorthands, tokens, TabList, Tab } from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { ComingSoonPage } from '../../shared/ComingSoonPage';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { formatCurrency, type IRiskCostManagement, type IRiskCostItem } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

type ForecastTab = 'checklist' | 'summary' | 'gcgr' | 'cashflow';

const CHECKLIST_ITEMS = [
  { title: 'Budget Review', description: 'Verify original contract amount and approved change orders are reflected accurately.' },
  { title: 'Cost Projections', description: 'Review cost-to-complete estimates for all active cost codes.' },
  { title: 'Cash Flow Analysis', description: 'Assess billing projections against anticipated expenditures.' },
  { title: 'Risk Assessment', description: 'Identify and quantify potential risks impacting the project forecast.' },
  { title: 'Contingency Review', description: 'Evaluate remaining contingency and recommend adjustments.' },
];

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
  },
  tabContent: {
    ...shorthands.padding('16px', '0'),
  },
  checklistItem: {
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  checklistTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: HBC_COLORS.navy,
  },
  checklistDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  noProject: {
    ...shorthands.padding('48px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Open: { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  Realized: { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  Mitigated: { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  Closed: { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
};

const riskItemColumns: IHbcDataTableColumn<IRiskCostItem>[] = [
  { key: 'description', header: 'Description', render: (row) => row.description },
  { key: 'category', header: 'Category', render: (row) => row.category },
  {
    key: 'estimatedValue',
    header: 'Amount',
    render: (row) => formatCurrency(row.estimatedValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const colors = STATUS_COLORS[row.status] || STATUS_COLORS.Open;
      return <StatusBadge label={row.status} color={colors.color} backgroundColor={colors.bg} />;
    },
  },
];

export const FinancialForecastingPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';

  const [activeTab, setActiveTab] = React.useState<ForecastTab>('checklist');
  const [riskData, setRiskData] = React.useState<IRiskCostManagement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!projectCode) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await dataService.getRiskCostManagement(projectCode);
        if (!cancelled) setRiskData(data);
      } catch (err) {
        console.error('Failed to load risk/cost data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Financial Forecasting" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view financial forecasting." />
      </div>
    );
  }

  const allRiskItems: IRiskCostItem[] = riskData
    ? [...riskData.buyoutOpportunities, ...riskData.potentialRisks, ...riskData.potentialSavings]
    : [];

  const totalVariance = allRiskItems.reduce((sum, item) => sum + item.estimatedValue, 0);

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData): void => {
    setActiveTab(data.value as ForecastTab);
  };

  return (
    <div className={styles.root}>
      <PageHeader title="Financial Forecasting" subtitle="Review project cost forecasts and risk assessment" />

      <TabList selectedValue={activeTab} onTabSelect={handleTabSelect}>
        <Tab value="checklist">Review Checklist</Tab>
        <Tab value="summary">Forecast Summary</Tab>
        <Tab value="gcgr">GC/GR Forecast</Tab>
        <Tab value="cashflow">Cash Flow Forecast</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {activeTab === 'checklist' && (
          <CollapsibleSection title="Monthly Review Checklist" defaultExpanded>
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.title} className={styles.checklistItem}>
                <div className={styles.checklistTitle}>{item.title}</div>
                <div className={styles.checklistDesc}>{item.description}</div>
              </div>
            ))}
          </CollapsibleSection>
        )}

        {activeTab === 'summary' && (
          isLoading ? (
            <HbcSkeleton variant="kpi-grid" columns={4} />
          ) : (
            <div className={styles.kpiRow}>
              <KPICard title="Original Budget" value={riskData ? formatCurrency(riskData.contractAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'} />
              <KPICard
                title="Current Forecast"
                value={riskData ? formatCurrency(riskData.contractAmount + totalVariance, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
              />
              <KPICard
                title="Variance"
                value={riskData ? formatCurrency(totalVariance, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
              />
              <KPICard
                title="Risk Items"
                value={allRiskItems.length}
                subtitle={`${allRiskItems.filter((i) => i.status === 'Open').length} open`}
              />
            </div>
          )
        )}

        {activeTab === 'gcgr' && (
          isLoading ? (
            <HbcSkeleton variant="table" rows={5} />
          ) : (
            <HbcDataTable<IRiskCostItem>
              tableId="financial-forecasting-gcgr"
              columns={riskItemColumns}
              items={allRiskItems}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              emptyTitle="No Risk/Cost Items"
              emptyDescription="No risk or cost items have been recorded for this project."
              ariaLabel="GC/GR Forecast table"
              pageSize={15}
            />
          )
        )}

        {activeTab === 'cashflow' && (
          <HbcCard title="Cash Flow Forecast">
            <ComingSoonPage title="Cash Flow Forecast" />
          </HbcCard>
        )}
      </div>
    </div>
  );
};
