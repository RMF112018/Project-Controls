import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from '@components/App';
import { MockDataService } from '@services/MockDataService';
import { RoleName } from '@models/enums';
import { RoleSwitcher } from './RoleSwitcher';
import { setMockUserRole, getMockUserRole } from './mockContext';

const dataService = new MockDataService();

const DevRoot: React.FC = () => {
  const [role, setRole] = React.useState<RoleName>(getMockUserRole());

  const handleRoleChange = React.useCallback(
    (newRole: RoleName) => {
      if (newRole === role) return;
      setMockUserRole(newRole);
      dataService.setCurrentUserRole(newRole);
      window.location.hash = '#/';
      setRole(newRole);
    },
    [role]
  );

  return (
    <>
      <App key={role} dataService={dataService} />
      <RoleSwitcher role={role} onRoleChange={handleRoleChange} />
    </>
  );
};

ReactDOM.render(<DevRoot />, document.getElementById('root'));
