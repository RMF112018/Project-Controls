import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { useHelp } from '../contexts/HelpContext';
import { AppLauncher } from '../navigation/AppLauncher';
import { ContextualSidebar } from '../navigation/ContextualSidebar';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { SearchBar } from '../shared/SearchBar';
import { SyncStatusIndicator } from '../shared/SyncStatusIndicator';
import { PresenceIndicator } from '../shared/PresenceIndicator';
import { WhatsNewModal, shouldShowWhatsNew } from '../shared/WhatsNewModal';
import { HbcCommandPalette } from '../shared/HbcCommandPalette';
import type { IHbcCommandPaletteCommand } from '../shared/HbcCommandPalette';
import { HbcInsightsPanel } from '../shared/HbcInsightsPanel';
import type { IHbcInsightItem } from '../shared/HbcInsightsPanel';
import { useHbcMotionStyles } from '../shared/HbcMotion';
import { HelpMenu, HelpPanel, GuidedTour, ContactSupportDialog } from '../help';
import { FeatureGate } from '../guards';
import { useResponsive } from '../hooks/useResponsive';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { IEnvironmentConfig } from '@hbc/sp-services';
import { HeaderUserMenu } from '../shared/HeaderUserMenu';
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
    ...shorthands.padding('12px', '16px'),
    minHeight: '44px',
    minWidth: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    ...shorthands.padding('0'),
    minWidth: '44px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
  brandName: {
    fontWeight: '700',
    fontSize: '16px',
    color: '#FFFFFF',
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
    ...shorthands.padding('0'),
    minWidth: '44px',
    minHeight: '44px',
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
  dev: { bg: '#1E3A8A', text: '#fff' },
  vetting: { bg: '#92400E', text: '#fff' },
  prod: { bg: '#065F46', text: '#fff' },
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
  const motionStyles = useHbcMotionStyles();
  const { dataService, isFeatureEnabled, isFullScreen, toggleFullScreen, exitFullScreen, isOnline, isLoading, error } = useAppContext();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useAppNavigate();
  const { pathname } = useAppLocation();
  const isHubRoute = pathname === '/' || pathname === '/hub';
  const { isHelpPanelOpen, helpPanelMode } = useHelp();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = React.useState(false);

  const commandPaletteCommands = React.useMemo<IHbcCommandPaletteCommand[]>(() => [
    {
      id: 'toggle-fullscreen',
      label: isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen',
      keywords: ['fullscreen', 'layout', 'focus'],
      section: 'View',
      run: toggleFullScreen,
    },
    {
      id: 'open-whats-new',
      label: 'Open What\'s New',
      keywords: ['release', 'version', 'notes'],
      section: 'Help',
      run: () => setWhatsNewOpen(true),
    },
    {
      id: 'toggle-mobile-navigation',
      label: mobileNavOpen ? 'Close Navigation' : 'Open Navigation',
      keywords: ['navigation', 'menu', 'sidebar'],
      section: 'Navigation',
      run: () => setMobileNavOpen((current) => !current),
    },
    {
      id: 'open-insights',
      label: 'Open Insights Panel',
      keywords: ['insights', 'guidance', 'context'],
      section: 'View',
      run: () => setIsInsightsPanelOpen(true),
    },
    {
      id: 'nav-preconstruction',
      label: 'Go to Preconstruction',
      keywords: ['preconstruction', 'precon', 'bd', 'estimating'],
      section: 'Navigation',
      requiredFeatureFlags: ['PreconstructionWorkspace'],
      run: () => navigate('/preconstruction'),
    },
    {
      id: 'nav-precon-bd',
      label: 'Go to Business Development',
      keywords: ['bd', 'leads', 'pipeline', 'go-no-go'],
      section: 'Navigation',
      requiredFeatureFlags: ['PreconstructionWorkspace'],
      run: () => navigate('/preconstruction/bd'),
    },
    {
      id: 'nav-precon-estimating',
      label: 'Go to Estimating',
      keywords: ['estimating', 'estimates', 'job requests'],
      section: 'Navigation',
      requiredFeatureFlags: ['PreconstructionWorkspace'],
      run: () => navigate('/preconstruction/estimating'),
    },
    {
      id: 'nav-precon-ids',
      label: 'Go to Innovation & Digital Services',
      keywords: ['ids', 'innovation', 'digital'],
      section: 'Navigation',
      requiredFeatureFlags: ['PreconstructionWorkspace'],
      run: () => navigate('/preconstruction/ids'),
    },
  ], [isFullScreen, mobileNavOpen, toggleFullScreen, navigate]);

  // Keyboard shortcuts
  useKeyboardShortcut([
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
    {
      key: 'k',
      ctrlKey: true,
      handler: () => setIsCommandPaletteOpen(true),
      ignoreInputs: false,
    },
    {
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
      handler: () => { setIsInsightsPanelOpen(true); },
      ignoreInputs: false,
    },
  ]);
  const [envConfig, setEnvConfig] = React.useState<IEnvironmentConfig | null>(null);

  // Load environment config if PermissionEngine is enabled.
  const permissionEngineEnabled = isFeatureEnabled('PermissionEngine');
  React.useEffect(() => {
    if (permissionEngineEnabled) {
      dataService.getEnvironmentConfig()
        .then(setEnvConfig)
        .catch(() => setEnvConfig(null));
    }
  }, [dataService, permissionEngineEnabled]);

  // Auto-open What's New on first load after version bump
  React.useEffect(() => {
    if (shouldShowWhatsNew()) {
      setWhatsNewOpen(true);
    }
  }, []);

  const insightsItems = React.useMemo<IHbcInsightItem[]>(() => [
    {
      id: 'offline-signal',
      title: isOnline ? 'Connection is healthy' : 'Offline mode active',
      description: isOnline
        ? 'Live data updates and synchronization are available.'
        : 'Actions will continue using cached data until connectivity is restored.',
      severity: isOnline ? 'info' : 'warning',
    },
    {
      id: 'help-system',
      title: 'Guided help is enabled',
      description: 'Use Ctrl+K and search for "tour" to start contextual guidance.',
      severity: 'info',
      isVisible: true,
    },
    {
      id: 'fullscreen-tip',
      title: isFullScreen ? 'Focused mode enabled' : 'Focused mode available',
      description: isFullScreen
        ? 'Press Escape to exit focused mode.'
        : 'Press Ctrl+Shift+F to enter focused mode and reduce visual clutter.',
      severity: 'info',
    },
  ], [isOnline, isFullScreen]);

  const sidebarWidth = isMobile ? 0 : isTablet ? 48 : 220;

  // Loading / error early exits — placed after all hooks to satisfy React rules-of-hooks
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
          <AppLauncher />
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
          <HelpMenu />
          <SyncStatusIndicator />
          {/* Stage 6 Sub-task 4: RealTimeUpdates is intentionally disabled/deprecated by default. */}
          <FeatureGate featureName="RealTimeUpdates">
            <PresenceIndicator />
          </FeatureGate>
          <HeaderUserMenu onWhatsNew={() => setWhatsNewOpen(true)} />
        </div>
      </header>

      <div className={styles.body}>
        {/* Mobile nav overlay — suppressed on hub/dashboard */}
        {!isFullScreen && !isHubRoute && isMobile && mobileNavOpen && (
          <>
            <div className={styles.mobileOverlay} onClick={() => setMobileNavOpen(false)} />
            <div className={styles.mobileNav}>
              <ContextualSidebar />
            </div>
          </>
        )}

        {/* Desktop/Tablet sidebar — hidden in full-screen and on hub/dashboard */}
        {!isFullScreen && !isHubRoute && !isMobile && (
          <nav
            data-print-hide
            aria-label="Main navigation"
            className={styles.desktopNav}
            style={{ width: `${sidebarWidth}px`, overflow: isTablet ? 'hidden' : 'auto' }}
          >
            <ContextualSidebar />
          </nav>
        )}

        <main
          id="hbc-main-content"
          tabIndex={-1}
          className={mergeClasses(
            styles.main,
            isMobile ? styles.mainMobile : styles.mainDesktop,
            motionStyles.routeTransition
          )}
          style={{ position: 'relative' }}
        >
          {children}
        </main>
      </div>

      <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      <HbcCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        commands={commandPaletteCommands}
      />
      <HbcInsightsPanel
        open={isInsightsPanelOpen}
        onOpenChange={setIsInsightsPanelOpen}
        title="Contextual Insights"
        items={insightsItems}
      />
      {isHelpPanelOpen && <HelpPanel mode={helpPanelMode} />}
      <GuidedTour />
      <ContactSupportDialog />
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
