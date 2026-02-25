import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';

const srOnly: React.CSSProperties = {
  position: 'absolute', width: '1px', height: '1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
};

export interface IFeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional screen-reader announcement when the feature gate denies access. */
  announceDenied?: string;
}

export const FeatureGate: React.FC<IFeatureGateProps> = ({ featureName, children, fallback = null, announceDenied }) => {
  const { isFeatureEnabled } = useAppContext();

  if (!isFeatureEnabled(featureName)) {
    return (
      <>
        {fallback}
        {announceDenied && <span role="status" aria-live="polite" style={srOnly}>{announceDenied}</span>}
      </>
    );
  }

  return <>{children}</>;
};
