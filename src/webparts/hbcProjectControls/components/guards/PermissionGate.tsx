import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';

export interface IPermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<IPermissionGateProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAppContext();

  if (!hasPermission(permission)) return <>{fallback}</>;

  return <>{children}</>;
};
