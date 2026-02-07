import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { RenderMode } from '../../models/enums';
import { HubNav } from './HubNav';
import { ProjectNav } from './ProjectNav';
import { PreconNav } from './PreconNav';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SearchBar } from '../shared/SearchBar';
import { HBC_COLORS } from '../../theme/tokens';

interface IAppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<IAppShellProps> = ({ children }) => {
  const { renderMode, isLoading, error, currentUser } = useAppContext();

  if (isLoading) {
    return <LoadingSpinner label="Initializing HBC Project Controls..." size="large" />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.error }}>
        <h2>Unable to load application</h2>
        <p>{error}</p>
      </div>
    );
  }

  const NavComponent = renderMode === RenderMode.Full ? HubNav
    : renderMode === RenderMode.Project ? ProjectNav
    : PreconNav;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <header style={{
        backgroundColor: HBC_COLORS.navy,
        color: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: HBC_COLORS.orange }}>HBC</span>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>{renderMode === RenderMode.Standalone ? 'Estimating Tracker' : 'Project Controls'}</span>
        </div>
        <SearchBar />
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ opacity: 0.8 }}>{currentUser.displayName}</span>
          </div>
        )}
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <NavComponent />
        <main style={{ flex: 1, padding: '24px', backgroundColor: HBC_COLORS.gray50, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
