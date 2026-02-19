import * as React from 'react';
import { Navigate } from '@router';
import { useAppContext } from '../contexts/AppContext';

export interface IProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ permission, children }) => {
  const { hasPermission, isLoading } = useAppContext();

  if (isLoading) return null;

  if (!hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
