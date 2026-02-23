import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge, Input } from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IBambooHREmployee } from '@hbc/sp-services';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '0'),
    flexWrap: 'wrap' as const,
    ...shorthands.gap('12px'),
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '0', '8px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  th: {
    textAlign: 'left' as const,
    ...shorthands.padding('10px', '12px'),
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  noData: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const BambooDirectoryPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [employees, setEmployees] = React.useState<IBambooHREmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    dataService
      .getBambooEmployees()
      .then(result => setEmployees(result))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const handleSync = React.useCallback(async () => {
    setSyncing(true);
    try {
      await dataService.syncBambooEmployees();
      const updated = await dataService.getBambooEmployees();
      setEmployees(updated);
    } finally {
      setSyncing(false);
    }
  }, [dataService]);

  const filtered = React.useMemo(() => {
    if (!search) return employees;
    const term = search.toLowerCase();
    return employees.filter(
      e =>
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term) ||
        e.jobTitle.toLowerCase().includes(term),
    );
  }, [employees, search]);

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const departments = new Set(employees.map(e => e.department)).size;

  return (
    <div>
      <PageHeader title="Employee Directory" subtitle="BambooHR employee directory synced via one-way integration." />
      {!loading && employees.length > 0 && (
        <div className={styles.kpiGrid}>
          <KPICard title="Total Employees" value={employees.length} />
          <KPICard title="Active" value={activeCount} />
          <KPICard title="Departments" value={departments} />
        </div>
      )}
      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <Input
            contentBefore={<Search24Regular />}
            placeholder="Search employees..."
            value={search}
            onChange={(_, data) => setSearch(data.value)}
          />
          <span style={{ fontSize: '14px', color: tokens.colorNeutralForeground3 }}>
            {filtered.length} employees
          </span>
        </div>
        <HbcButton emphasis="strong" isLoading={syncing} onClick={handleSync}>
          Sync from BambooHR
        </HbcButton>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : filtered.length === 0 ? (
        <p className={styles.noData}>No employees found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Job Title</th>
              <th className={styles.th}>Department</th>
              <th className={styles.th}>Supervisor</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id}>
                <td className={styles.td}>
                  {emp.firstName} {emp.lastName}
                </td>
                <td className={styles.td}>{emp.email}</td>
                <td className={styles.td}>{emp.jobTitle}</td>
                <td className={styles.td}>{emp.department}</td>
                <td className={styles.td}>{emp.supervisor}</td>
                <td className={styles.td}>
                  <Badge
                    appearance="filled"
                    color={emp.status === 'Active' ? 'success' : 'informative'}
                  >
                    {emp.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
