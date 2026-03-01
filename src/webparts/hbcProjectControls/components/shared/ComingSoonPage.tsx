import * as React from 'react';
import { tokens } from '@fluentui/react-components';
import { PageHeader } from './PageHeader';

interface IComingSoonPageProps {
  title: string;
}

export const ComingSoonPage: React.FC<IComingSoonPageProps> = ({ title }) => (
  <div>
    <PageHeader title={title} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 8px', color: tokens.colorBrandForeground1, fontSize: 18 }}>Coming Soon</h3>
      <p style={{ margin: 0, color: tokens.colorNeutralForeground2, fontSize: 14, maxWidth: 400 }}>
        This module is under development and will be available in a future release.
      </p>
    </div>
  </div>
);
