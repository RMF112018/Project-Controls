import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  groupLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    ...shorthands.margin('0', '0', '4px'),
  },
  groupDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('0'),
  },
});

const ADMIN_GROUPS = [
  {
    label: 'System Configuration',
    description: 'Service connections, hub site URL configuration, and workflow definitions.',
    path: '/admin/connections',
  },
  {
    label: 'Security & Access',
    description: 'Role management, permission templates, project assignments, and sector definitions.',
    path: '/admin/roles',
  },
  {
    label: 'Entra Role Mapping',
    description: 'Map Microsoft Entra groups/roles to internal app roles and permission templates.',
    path: '/admin/entra-mappings',
  },
  {
    label: 'Provisioning',
    description: 'Site provisioning queue, retry management, and template sync.',
    path: '/admin/provisioning',
  },
  {
    label: 'Dev Tools',
    description: 'Developer user management, feature flag toggles, and audit log viewer.',
    path: '/admin/dev-users',
  },
  {
    label: 'Telemetry Dashboard',
    description: 'Production monitoring for lazy-load, virtualization, accessibility, and load performance metrics.',
    path: '/admin/telemetry',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div>
      <PageHeader title="Administration" subtitle="System configuration, security, provisioning, and developer tools." />
      <div className={styles.grid}>
        {ADMIN_GROUPS.map(group => (
          <HbcCard key={group.path} title={group.label} interactive onClick={() => navigate(group.path)}>
            <p className={styles.groupDescription}>{group.description}</p>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
