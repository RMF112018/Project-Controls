import * as React from 'react';
import { Spinner } from '@fluentui/react-components';

interface ILoadingSpinnerProps {
  label?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({ label = 'Loading...', size = 'medium' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
    <Spinner size={size} label={label} />
  </div>
);
