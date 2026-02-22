import * as React from 'react';
import { RoleName, normalizeRoleName } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';

export interface IRoleGateProps {
  allowedRoles: RoleName[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<IRoleGateProps> = ({ allowedRoles, children, fallback = null }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) return <>{fallback}</>;

  // Normalize both user roles AND allowed roles for bidirectional compatibility
  const normalizedUserRoles = currentUser.roles.map(r => normalizeRoleName(r));
  const normalizedAllowed = allowedRoles.map(r => normalizeRoleName(r));

  const hasRole = normalizedUserRoles.some(role => normalizedAllowed.includes(role));
  if (!hasRole) return <>{fallback}</>;

  return <>{children}</>;
};
