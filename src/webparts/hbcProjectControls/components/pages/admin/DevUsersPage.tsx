import * as React from 'react';
import { MessageBar, MessageBarBody, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';

interface IMockUser {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
}

const MOCK_USERS: IMockUser[] = [
  { id: 1, displayName: 'John Smith', email: 'john.smith@hedrick.com', roles: ['Admin'] },
  { id: 2, displayName: 'Jane Doe', email: 'jane.doe@hedrick.com', roles: ['Business Development Manager'] },
  { id: 3, displayName: 'Mike Johnson', email: 'mike.johnson@hedrick.com', roles: ['Estimating Coordinator'] },
  { id: 4, displayName: 'Sarah Williams', email: 'sarah.williams@hedrick.com', roles: ['Project Manager'] },
  { id: 5, displayName: 'Robert Brown', email: 'robert.brown@hedrick.com', roles: ['Leadership'] },
  { id: 6, displayName: 'Emily Davis', email: 'emily.davis@hedrick.com', roles: ['Project Executive'] },
  { id: 7, displayName: 'David Wilson', email: 'david.wilson@hedrick.com', roles: ['Admin', 'Project Manager'] },
  { id: 8, displayName: 'Lisa Martinez', email: 'lisa.martinez@hedrick.com', roles: ['Business Development Manager', 'Estimating Coordinator'] },
];

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  banner: {
    marginBottom: '16px',
  },
  notAvailable: {
    ...shorthands.padding('24px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
  comingSoonBadge: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: 500 as const,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

export const DevUsersPage: React.FC = () => {
  const styles = useStyles();
  const { dataServiceMode } = useAppContext();

  const [users] = React.useState<IMockUser[]>(MOCK_USERS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate async load for mock data
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (dataServiceMode !== 'mock') {
    return (
      <div>
        <PageHeader title="Dev Users" />
        <div className={styles.notAvailable}>
          Dev Users is only available in mock mode. Current mode: {dataServiceMode}.
        </div>
      </div>
    );
  }

  const columns: IHbcDataTableColumn<IMockUser>[] = [
    {
      key: 'displayName',
      header: 'Display Name',
      render: (row) => row.displayName,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => row.roles.join(', '),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Dev Users" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dev Users"
        subtitle="Mock user accounts for development and testing."
        actions={
          <span className={styles.comingSoonBadge}>Edit — Coming Soon</span>
        }
      />
      <div className={styles.container}>
        <div className={styles.banner}>
          <MessageBar>
            <MessageBarBody>
              Changes are session-only and will not persist across page reloads.
            </MessageBarBody>
          </MessageBar>
        </div>

        <HbcDataTable
          tableId="admin-dev-users"
          columns={columns}
          items={users}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};
