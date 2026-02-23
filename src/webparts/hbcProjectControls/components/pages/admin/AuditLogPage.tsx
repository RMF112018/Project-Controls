import * as React from 'react';
import { Input, Select, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { ExportButtons } from '../../shared/ExportButtons';
import { useAppContext } from '../../contexts/AppContext';
import type { IAuditEntry } from '@hbc/sp-services';

const ENTITY_TYPE_OPTIONS = [
  'All',
  'RoleConfiguration',
  'FeatureFlag',
  'Lead',
  'Scorecard',
  'Config',
  'Project',
  'Permission',
  'Estimate',
  'Schedule',
  'PMP',
  'MonthlyReview',
] as const;

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  filters: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '16px',
  },
  filterField: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 500 as const,
    color: tokens.colorNeutralForeground3,
  },
  exportRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.padding('8px', '0'),
  },
  truncated: {
    display: 'inline-block',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncateDetails(details: string, maxLength: number = 50): string {
  if (!details) return '\u2014';
  return details.length > maxLength ? `${details.slice(0, maxLength)}...` : details;
}

export const AuditLogPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();

  const [entries, setEntries] = React.useState<IAuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [entityTypeFilter, setEntityTypeFilter] = React.useState('All');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');

  const fetchAuditLog = React.useCallback(() => {
    setLoading(true);
    const entityType = entityTypeFilter === 'All' ? undefined : entityTypeFilter;
    dataService.getAuditLog(entityType, undefined, fromDate || undefined, toDate || undefined)
      .then(result => setEntries(result))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [dataService, entityTypeFilter, fromDate, toDate]);

  React.useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const handleApplyFilters = React.useCallback(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const columns = React.useMemo((): IHbcDataTableColumn<IAuditEntry>[] => [
    {
      key: 'Timestamp',
      header: 'Timestamp',
      render: (row) => formatTimestamp(row.Timestamp),
    },
    {
      key: 'User',
      header: 'User',
      render: (row) => row.User || '\u2014',
    },
    {
      key: 'Action',
      header: 'Action',
      render: (row) => row.Action || '\u2014',
    },
    {
      key: 'EntityType',
      header: 'Entity Type',
      render: (row) => row.EntityType || '\u2014',
    },
    {
      key: 'EntityId',
      header: 'Entity ID',
      render: (row) => row.EntityId || '\u2014',
    },
    {
      key: 'FieldChanged',
      header: 'Field Changed',
      render: (row) => row.FieldChanged || '\u2014',
    },
    {
      key: 'Details',
      header: 'Details',
      render: (row) => (
        <span className={styles.truncated} title={row.Details}>
          {truncateDetails(row.Details)}
        </span>
      ),
    },
  ], [styles]);

  const exportData = React.useMemo(() => {
    return entries.map(entry => ({
      Timestamp: entry.Timestamp,
      User: entry.User,
      Action: entry.Action,
      EntityType: entry.EntityType,
      EntityId: entry.EntityId,
      FieldChanged: entry.FieldChanged || '',
      PreviousValue: entry.PreviousValue || '',
      NewValue: entry.NewValue || '',
      Details: entry.Details,
    }));
  }, [entries]);

  if (loading && entries.length === 0) {
    return (
      <div>
        <PageHeader title="Audit Log" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="View system audit trail filtered by entity type and date range."
      />
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Entity Type</span>
            <Select
              value={entityTypeFilter}
              onChange={(_, data) => setEntityTypeFilter(data.value)}
              aria-label="Filter by entity type"
            >
              {ENTITY_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>From (YYYY-MM-DD)</span>
            <Input
              value={fromDate}
              onChange={(_, data) => setFromDate(data.value)}
              placeholder="2026-01-01"
              aria-label="From date"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>To (YYYY-MM-DD)</span>
            <Input
              value={toDate}
              onChange={(_, data) => setToDate(data.value)}
              placeholder="2026-12-31"
              aria-label="To date"
            />
          </div>
          <HbcButton emphasis="strong" onClick={handleApplyFilters}>
            Apply Filters
          </HbcButton>
          <HbcButton onClick={fetchAuditLog}>
            Refresh
          </HbcButton>
        </div>

        <div className={styles.exportRow}>
          <ExportButtons data={exportData} filename="audit-log" title="Audit Log" />
        </div>

        <HbcDataTable
          tableId="admin-audit-log"
          columns={columns}
          items={entries}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};
