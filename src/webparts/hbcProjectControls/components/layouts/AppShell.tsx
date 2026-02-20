import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { useHelp } from '../contexts/HelpContext';
import { NavigationSidebar } from './NavigationSidebar';
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
import { useCurrentModule } from '../hooks/useCurrentModule';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useProjectSelectionBootstrap } from '../hooks/useProjectSelectionBootstrap';
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
  userName: {
    fontSize: '13px',
    opacity: 0.8,
  },
  version: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.85)',
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

const AppShellComponent: React.FC<IAppShellProps> = ({ children }) => {
  const styles = useStyles();
  const motionStyles = useHbcMotionStyles();
  useProjectSelectionBootstrap();
  const { isLoading, error, currentUser, dataService, isFeatureEnabled, isFullScreen, toggleFullScreen, exitFullScreen, isOnline } = useAppContext();
  const { isMobile, isTablet } = useResponsive();
  const { setCurrentModuleKey, isHelpPanelOpen, helpPanelMode, startTour: startHelpTour, isTourActive } = useHelp();
  const currentModuleKey = useCurrentModule();
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
      id: 'start-guided-tour',
      label: 'Start Guided Tour',
      keywords: ['tour', 'help', 'guide'],
      section: 'Help',
      requiredFeatureFlags: ['EnableHelpSystem'],
      isVisible: () => Boolean(currentModuleKey),
      run: () => {
        if (currentModuleKey) {
          startHelpTour(currentModuleKey);
        }
      },
    },
    {
      id: 'open-insights',
      label: 'Open Insights Panel',
      keywords: ['insights', 'guidance', 'context'],
      section: 'View',
      requiredFeatureFlags: ['uxInsightsPanelV1'],
      run: () => setIsInsightsPanelOpen(true),
    },
  ], [currentModuleKey, isFullScreen, mobileNavOpen, startHelpTour, toggleFullScreen]);

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
      handler: () => {
        if (isFeatureEnabled('uxInsightsPanelV1')) {
          setIsInsightsPanelOpen(true);
        }
      },
      ignoreInputs: false,
    },
  ]);
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
      title: isFeatureEnabled('EnableHelpSystem') ? 'Guided help is enabled' : 'Guided help is disabled',
      description: isFeatureEnabled('EnableHelpSystem')
        ? 'Use Ctrl+K and search for "tour" to start contextual guidance.'
        : 'Enable the help system feature flag to activate tours and contextual documentation.',
      severity: isFeatureEnabled('EnableHelpSystem') ? 'info' : 'warning',
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
  ], [isOnline, isFeatureEnabled, isFullScreen]);
  const enableMotion = isFeatureEnabled('uxDelightMotionV1');

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
          <FeatureGate featureName="RealTimeUpdates">
            <PresenceIndicator />
          </FeatureGate>
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
          className={mergeClasses(
            styles.main,
            isMobile ? styles.mainMobile : styles.mainDesktop,
            enableMotion ? motionStyles.routeTransition : undefined
          )}
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
      {isFeatureEnabled('uxInsightsPanelV1') ? (
        <HbcInsightsPanel
          open={isInsightsPanelOpen}
          onOpenChange={setIsInsightsPanelOpen}
          title="Contextual Insights"
          contextKey={currentModuleKey ?? undefined}
          items={insightsItems}
        />
      ) : null}
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

export const AppShell = React.memo(AppShellComponent);
