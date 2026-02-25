import * as React from 'react';
import { Navigate } from '@router';
import { useAppContext } from '../contexts/AppContext';

const srOnly: React.CSSProperties = {
  position: 'absolute', width: '1px', height: '1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
};

export interface IProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ permission, children }) => {
  const { hasPermission, isLoading } = useAppContext();

  if (isLoading) {
    return <span role="status" aria-live="polite" style={srOnly}>Checking permissions…</span>;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
