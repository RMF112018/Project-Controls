import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';
import { PageHeader } from './PageHeader';

interface IComingSoonPageProps {
  title: string;
}

export const ComingSoonPage: React.FC<IComingSoonPageProps> = ({ title }) => (
  <div>
    <PageHeader title={title} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 8px', color: HBC_COLORS.navy, fontSize: 18 }}>Coming Soon</h3>
      <p style={{ margin: 0, color: HBC_COLORS.gray500, fontSize: 14, maxWidth: 400 }}>
        This module is under development and will be available in a future release.
      </p>
    </div>
  </div>
);
