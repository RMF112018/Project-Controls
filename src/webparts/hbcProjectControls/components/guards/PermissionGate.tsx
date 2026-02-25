import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';

const srOnly: React.CSSProperties = {
  position: 'absolute', width: '1px', height: '1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
};

export interface IPermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional screen-reader announcement when the permission gate denies access. */
  announceDenied?: string;
}

export const PermissionGate: React.FC<IPermissionGateProps> = ({ permission, children, fallback = null, announceDenied }) => {
  const { hasPermission } = useAppContext();

  if (!hasPermission(permission)) {
    return (
      <>
        {fallback}
        {announceDenied && <span role="status" aria-live="polite" style={srOnly}>{announceDenied}</span>}
      </>
    );
  }

  return <>{children}</>;
};
