import * as React from 'react';
import { RoleName } from '../../models';
import { useAppContext } from '../contexts/AppContext';

export interface IRoleGateProps {
  allowedRoles: RoleName[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<IRoleGateProps> = ({ allowedRoles, children, fallback = null }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) return <>{fallback}</>;

  const hasRole = currentUser.roles.some(role => allowedRoles.includes(role));
  if (!hasRole) return <>{fallback}</>;

  return <>{children}</>;
};
