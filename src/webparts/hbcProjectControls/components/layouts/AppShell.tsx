import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { NavigationSidebar } from './NavigationSidebar';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { SearchBar } from '../shared/SearchBar';
import { SyncStatusIndicator } from '../shared/SyncStatusIndicator';
import { WhatsNewModal, shouldShowWhatsNew } from '../shared/WhatsNewModal';
import { useResponsive } from '../hooks/useResponsive';
import { HBC_COLORS } from '../../theme/tokens';
import { APP_VERSION } from '../../utils/constants';

interface IAppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<IAppShellProps> = ({ children }) => {
  const { isLoading, error, currentUser } = useAppContext();
  const { isMobile, isTablet } = useResponsive();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);

  // Auto-open What's New on first load after version bump
  React.useEffect(() => {
    if (shouldShowWhatsNew()) {
      setWhatsNewOpen(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <SkeletonLoader variant="text" rows={1} style={{ marginBottom: '24px', maxWidth: '300px' }} />
        <SkeletonLoader variant="kpi-grid" columns={4} style={{ marginBottom: '32px' }} />
        <SkeletonLoader variant="table" rows={8} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: HBC_COLORS.error }}>
        <h2>Unable to load application</h2>
        <p>{error}</p>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : isTablet ? 48 : 220;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Skip to main content — accessibility */}
      <a
        href="#hbc-main-content"
        className="hbc-skip-link"
        style={{
          position: 'absolute',
          top: '-100px',
          left: '16px',
          zIndex: 3000,
          padding: '8px 16px',
          backgroundColor: HBC_COLORS.navy,
          color: '#fff',
          borderRadius: '0 0 4px 4px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Skip to main content
      </a>
      {/* Header */}
      <header data-print-hide role="banner" style={{
        backgroundColor: HBC_COLORS.navy,
        color: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        flexShrink: 0,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              style={{
                background: 'none', border: 'none', color: '#fff', fontSize: '20px',
                cursor: 'pointer', padding: '4px', lineHeight: 1,
              }}
            >
              {mobileNavOpen ? '\u2715' : '\u2630'}
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: '16px', color: HBC_COLORS.orange }}>HBC</span>
          {!isMobile && (
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Project Controls</span>
          )}
        </div>

        {!isMobile && <SearchBar />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SyncStatusIndicator />
          {currentUser && !isMobile && (
            <span style={{ fontSize: '13px', opacity: 0.8 }}>{currentUser.displayName}</span>
          )}
          <span
            onClick={() => setWhatsNewOpen(true)}
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
            title="What's New"
          >
            v{APP_VERSION}
          </span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Mobile nav overlay */}
        {isMobile && mobileNavOpen && (
          <>
            <div
              style={{
                position: 'fixed', top: '48px', left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999,
              }}
              onClick={() => setMobileNavOpen(false)}
            />
            <div style={{
              position: 'fixed', top: '48px', left: 0, bottom: 0,
              width: '260px', zIndex: 1000, backgroundColor: '#fff',
              boxShadow: '4px 0 16px rgba(0,0,0,0.15)', overflow: 'auto',
            }}>
              <NavigationSidebar />
            </div>
          </>
        )}

        {/* Desktop/Tablet sidebar */}
        {!isMobile && (
          <nav data-print-hide aria-label="Main navigation" style={{ width: `${sidebarWidth}px`, flexShrink: 0, overflow: isTablet ? 'hidden' : 'auto' }}>
            <NavigationSidebar />
          </nav>
        )}

        <main id="hbc-main-content" tabIndex={-1} style={{ flex: 1, padding: isMobile ? '16px' : '24px', backgroundColor: HBC_COLORS.gray50, overflow: 'auto', outline: 'none' }}>
          {children}
        </main>
      </div>

      <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      <style>{`
        .hbc-skip-link:focus {
          top: 0 !important;
        }
        @media print {
          header, nav, .hbc-skip-link, [data-print-hide] { display: none !important; }
          main { padding: 0 !important; background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};
