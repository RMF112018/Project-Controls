import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { GoNoGoDecision } from '@hbc/sp-services';
import type { IGoNoGoScorecard } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: 500 as const,
  },
});

export const GoNoGoPage: React.FC = () => {
  const styles = useStyles();

  const columns = React.useMemo((): IHbcDataTableColumn<IGoNoGoScorecard>[] => [
    { key: 'ProjectCode', header: 'Lead', render: (row) => row.ProjectCode || '—' },
    {
      key: 'scorecardStatus',
      header: 'Status',
      render: (row) => {
        const status = row.scorecardStatus || '—';
        return <span className={styles.statusPill} style={{ backgroundColor: tokens.colorNeutralBackground3 }}>{status}</span>;
      },
    },
    {
      key: 'Decision',
      header: 'Decision',
      render: (row) => {
        const decision = row.Decision || 'Pending';
        const bg = decision === GoNoGoDecision.Go ? tokens.colorStatusSuccessBackground2 : decision === GoNoGoDecision.NoGo ? tokens.colorStatusDangerBackground2 : tokens.colorStatusWarningBackground2;
        const fg = decision === GoNoGoDecision.Go ? tokens.colorStatusSuccessForeground2 : decision === GoNoGoDecision.NoGo ? tokens.colorStatusDangerForeground2 : tokens.colorStatusWarningForeground2;
        return <span className={styles.statusPill} style={{ backgroundColor: bg, color: fg }}>{decision}</span>;
      },
    },
    { key: 'TotalScore_Orig', header: 'Score', render: (row) => row.TotalScore_Orig !== undefined ? String(row.TotalScore_Orig) : '—' },
    { key: 'committeeMeetingDate', header: 'Meeting Date', render: (row) => row.committeeMeetingDate ? new Date(row.committeeMeetingDate).toLocaleDateString() : '—' },
  ], [styles]);
  const { dataService } = useAppContext();
  const [scorecards, setScorecards] = React.useState<IGoNoGoScorecard[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getScorecards()
      .then(setScorecards)
      .catch(() => setScorecards([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  return (
    <div>
      <PageHeader title="Go / No-Go Scorecards" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-gonogo"
          columns={columns}
          items={scorecards}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};
