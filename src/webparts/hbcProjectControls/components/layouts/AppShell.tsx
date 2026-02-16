import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { useHelp } from '../contexts/HelpContext';
import { NavigationSidebar } from './NavigationSidebar';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { SearchBar } from '../shared/SearchBar';
import { SyncStatusIndicator } from '../shared/SyncStatusIndicator';
import { WhatsNewModal, shouldShowWhatsNew } from '../shared/WhatsNewModal';
import { HelpMenu, HelpPanel, GuidedTour, ContactSupportDialog } from '../help';
import { FeatureGate } from '../guards';
import { useResponsive } from '../hooks/useResponsive';
import { useCurrentModule } from '../hooks/useCurrentModule';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { IEnvironmentConfig, APP_VERSION } from '@hbc/sp-services';
import { ArrowMaximize24Regular, ArrowMinimize24Regular } from '@fluentui/react-icons';
import { HBC_COLORS, SPACING, ELEVATION, TRANSITION } from '../../theme/tokens';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  // Loading state
  loadingContainer: {
    ...shorthands.padding(SPACING.lg),
    maxWidth: '1200px',
    ...shorthands.margin('0', 'auto'),
  },
  // Error state
  errorContainer: {
    ...shorthands.padding(SPACING.lg),
    textAlign: 'center',
    color: tokens.colorStatusDangerForeground1,
  },
  // Skip link (a11y)
  skipLink: {
    position: 'absolute',
    top: '-100px',
    left: '16px',
    zIndex: 3000,
    ...shorthands.padding('8px', '16px'),
    backgroundColor: HBC_COLORS.navy,
    color: '#fff',
    ...shorthands.borderRadius('0', '0', '4px', '4px'),
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  // Header
  header: {
    backgroundColor: HBC_COLORS.navy,
    color: '#FFFFFF',
    ...shorthands.padding('0', SPACING.lg),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '48px',
    flexShrink: 0,
    ...shorthands.gap('12px'),
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  hamburger: {
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    ...shorthands.padding('4px'),
    lineHeight: '1',
  },
  brandName: {
    fontWeight: '700',
    fontSize: '16px',
    color: HBC_COLORS.orange,
  },
  appTitle: {
    fontSize: '14px',
    opacity: 0.9,
  },
  envBadge: {
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  userName: {
    fontSize: '13px',
    opacity: 0.8,
  },
  version: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
  },
  // Body layout
  body: {
    display: 'flex',
    flexGrow: 1,
    position: 'relative',
  },
  // Mobile overlay
  mobileOverlay: {
    position: 'fixed',
    top: '48px',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  mobileNav: {
    position: 'fixed',
    top: '48px',
    left: '0',
    bottom: '0',
    width: '260px',
    zIndex: 1000,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: ELEVATION.level3,
    overflowY: 'auto',
  },
  // Desktop sidebar
  desktopNav: {
    flexShrink: 0,
  },
  // Main content
  main: {
    flexGrow: 1,
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
    ...shorthands.outline('none'),
  },
  mainDesktop: {
    ...shorthands.padding(SPACING.lg),
  },
  mainMobile: {
    ...shorthands.padding(SPACING.md),
  },
  // Full-screen mode
  rootFullScreen: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: 10000,
    backgroundColor: tokens.colorNeutralBackground2,
    transitionProperty: 'all',
    transitionDuration: TRANSITION.normal,
  },
  headerFullScreen: {
    height: '40px',
  },
  fullScreenBtn: {
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    ...shorthands.padding('4px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('4px'),
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
});

const ENV_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  dev: { bg: '#3B82F6', text: '#fff' },
  vetting: { bg: '#F59E0B', text: '#000' },
  prod: { bg: '#10B981', text: '#fff' },
};

const ENV_BADGE_LABELS: Record<string, string> = {
  dev: 'DEV',
  vetting: 'UAT',
  prod: 'PROD',
};

interface IAppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<IAppShellProps> = ({ children }) => {
  const styles = useStyles();
  const { isLoading, error, currentUser, dataService, isFeatureEnabled, isFullScreen, toggleFullScreen, exitFullScreen } = useAppContext();
  const { isMobile, isTablet } = useResponsive();
  const { setCurrentModuleKey, isHelpPanelOpen, helpPanelMode, startTour: startHelpTour, isTourActive } = useHelp();
  const currentModuleKey = useCurrentModule();

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      key: '?',
      shiftKey: true,
      handler: () => {
        if (isFeatureEnabled('EnableHelpSystem') && currentModuleKey && !isTourActive) {
          startHelpTour(currentModuleKey);
        }
      },
    },
    {
      key: 'f',
      ctrlKey: true,
      shiftKey: true,
      handler: toggleFullScreen,
      ignoreInputs: false,
    },
    {
      key: 'Escape',
      handler: () => { if (isFullScreen) exitFullScreen(); },
      ignoreInputs: false,
    },
  ]);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);
  const [envConfig, setEnvConfig] = React.useState<IEnvironmentConfig | null>(null);

  // Sync current module key into HelpContext whenever route changes
  React.useEffect(() => {
    setCurrentModuleKey(currentModuleKey);
  }, [currentModuleKey, setCurrentModuleKey]);

  // Load environment config if PermissionEngine is enabled
  React.useEffect(() => {
    if (isFeatureEnabled('PermissionEngine')) {
      dataService.getEnvironmentConfig()
        .then(setEnvConfig)
        .catch(() => setEnvConfig(null));
    }
  }, [dataService, isFeatureEnabled]);

  // Auto-open What's New on first load after version bump
  React.useEffect(() => {
    if (shouldShowWhatsNew()) {
      setWhatsNewOpen(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <SkeletonLoader variant="text" rows={1} style={{ marginBottom: '24px', maxWidth: '300px' }} />
        <SkeletonLoader variant="kpi-grid" columns={4} style={{ marginBottom: '32px' }} />
        <SkeletonLoader variant="table" rows={8} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Unable to load application</h2>
        <p>{error}</p>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : isTablet ? 48 : 220;

  return (
    <div className={mergeClasses(styles.root, isFullScreen && styles.rootFullScreen)}>
      {/* Skip to main content — accessibility */}
      <a href="#hbc-main-content" className={mergeClasses('hbc-skip-link', styles.skipLink)}>
        Skip to main content
      </a>

      {/* Header */}
      <header data-print-hide role="banner" className={mergeClasses(styles.header, isFullScreen && styles.headerFullScreen)}>
        <div className={styles.headerLeft}>
          {isMobile && (
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className={styles.hamburger}>
              {mobileNavOpen ? '\u2715' : '\u2630'}
            </button>
          )}
          <span className={styles.brandName}>HBC</span>
          {!isMobile && <span className={styles.appTitle}>Project Controls</span>}
          {envConfig && envConfig.currentTier !== 'prod' && (
            <span
              className={styles.envBadge}
              style={{
                backgroundColor: ENV_BADGE_COLORS[envConfig.currentTier]?.bg || '#3B82F6',
                color: ENV_BADGE_COLORS[envConfig.currentTier]?.text || '#fff',
              }}
            >
              {ENV_BADGE_LABELS[envConfig.currentTier] || envConfig.currentTier.toUpperCase()}
            </span>
          )}
        </div>

        {!isMobile && <SearchBar />}

        <div className={styles.headerRight}>
          <button
            onClick={toggleFullScreen}
            className={styles.fullScreenBtn}
            aria-label={isFullScreen ? 'Exit full screen (Esc)' : 'Enter full screen (Ctrl+Shift+F)'}
            title={isFullScreen ? 'Exit full screen (Esc)' : 'Enter full screen (Ctrl+Shift+F)'}
          >
            {isFullScreen ? <ArrowMinimize24Regular /> : <ArrowMaximize24Regular />}
          </button>
          <FeatureGate featureName="EnableHelpSystem">
            <HelpMenu />
          </FeatureGate>
          <SyncStatusIndicator />
          {currentUser && !isMobile && (
            <span className={styles.userName}>{currentUser.displayName}</span>
          )}
          <span onClick={() => setWhatsNewOpen(true)} className={styles.version} title="What's New">
            v{APP_VERSION}
          </span>
        </div>
      </header>

      <div className={styles.body}>
        {/* Mobile nav overlay */}
        {!isFullScreen && isMobile && mobileNavOpen && (
          <>
            <div className={styles.mobileOverlay} onClick={() => setMobileNavOpen(false)} />
            <div className={styles.mobileNav}>
              <NavigationSidebar />
            </div>
          </>
        )}

        {/* Desktop/Tablet sidebar — hidden in full-screen */}
        {!isFullScreen && !isMobile && (
          <nav
            data-print-hide
            aria-label="Main navigation"
            className={styles.desktopNav}
            style={{ width: `${sidebarWidth}px`, overflow: isTablet ? 'hidden' : 'auto' }}
          >
            <NavigationSidebar />
          </nav>
        )}

        <main
          id="hbc-main-content"
          tabIndex={-1}
          className={mergeClasses(styles.main, isMobile ? styles.mainMobile : styles.mainDesktop)}
        >
          {children}
        </main>
      </div>

      <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      {isHelpPanelOpen && <HelpPanel mode={helpPanelMode} />}
      <FeatureGate featureName="EnableHelpSystem">
        <GuidedTour />
        <ContactSupportDialog />
      </FeatureGate>
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
