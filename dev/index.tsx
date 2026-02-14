import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@components/App';
import { MockDataService } from '@services/MockDataService';
import { RoleName } from '@models/enums';
import { RoleSwitcher } from './RoleSwitcher';
import { setMockUserRole, getMockUserRole } from './mockContext';

const DEV_SUPER_ADMIN = 'DEV_SUPER_ADMIN';
type RoleValue = RoleName | typeof DEV_SUPER_ADMIN;

const dataService = new MockDataService();

const DevRoot: React.FC = () => {
  const [role, setRole] = React.useState<RoleValue>(getMockUserRole());

  const handleRoleChange = React.useCallback(
    (newRole: RoleValue) => {
      if (newRole === role) return;
      if (newRole === DEV_SUPER_ADMIN) {
        dataService.setDevSuperAdminMode(true);
      } else {
        dataService.setDevSuperAdminMode(false);
        setMockUserRole(newRole as RoleName);
        dataService.setCurrentUserRole(newRole as RoleName);
      }
      window.location.hash = '#/';
      setRole(newRole);
    },
    [role]
  );

  return (
    <>
      <App key={String(role)} dataService={dataService} />
      <RoleSwitcher role={role} onRoleChange={handleRoleChange} />
    </>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<DevRoot />);
}
