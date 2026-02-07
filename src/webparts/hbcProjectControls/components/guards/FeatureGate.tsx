import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';

export interface IFeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<IFeatureGateProps> = ({ featureName, children, fallback = null }) => {
  const { isFeatureEnabled } = useAppContext();

  if (!isFeatureEnabled(featureName)) return <>{fallback}</>;

  return <>{children}</>;
};
