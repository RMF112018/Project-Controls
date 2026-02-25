import * as React from 'react';
import { RoleName, normalizeRoleName } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';

const srOnly: React.CSSProperties = {
  position: 'absolute', width: '1px', height: '1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
};

export interface IRoleGateProps {
  allowedRoles: RoleName[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional screen-reader announcement when the role gate denies access. */
  announceDenied?: string;
}

export const RoleGate: React.FC<IRoleGateProps> = ({ allowedRoles, children, fallback = null, announceDenied }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return (
      <>
        {fallback}
        {announceDenied && <span role="status" aria-live="polite" style={srOnly}>{announceDenied}</span>}
      </>
    );
  }

  // Normalize both user roles AND allowed roles for bidirectional compatibility
  const normalizedUserRoles = currentUser.roles.map(r => normalizeRoleName(r));
  const normalizedAllowed = allowedRoles.map(r => normalizeRoleName(r));

  const hasRole = normalizedUserRoles.some(role => normalizedAllowed.includes(role));
  if (!hasRole) {
    return (
      <>
        {fallback}
        {announceDenied && <span role="status" aria-live="polite" style={srOnly}>{announceDenied}</span>}
      </>
    );
  }

  return <>{children}</>;
};
