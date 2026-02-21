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
import { PillarTabBar } from '../shared/PillarTabBar';
import { MacBarStatusPill } from '../shared/MacBarStatusPill';
import { ShellHydrationOverlay } from '../shared/ShellHydrationOverlay';
import { MobileBottomNav } from '../shared/MobileBottomNav';
import { useSwitchProject } from '../hooks/useSwitchProject';
import { useResponsive } from '../hooks/useResponsive';
import { useCurrentModule } from '../hooks/useCurrentModule';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useTransitionNavigate } from '../hooks/router/useTransitionNavigate';
import { useLeads } from '../hooks/useLeads';
import { isActiveStage, ProjectService, MockProjectService, UserProfileService, MockUserProfileService } from '@hbc/sp-services';
import type { ISelectedProject } from '../contexts/AppContext';
import { IEnvironmentConfig, APP_VERSION } from '@hbc/sp-services';
import { NavigationServicesProvider, useNavigationServices } from '../contexts/NavigationServicesContext';
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
  mainMobileBottomNav: {
    paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
  },
  devToggle: {
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    ...shorthands.borderRadius('4px'),
    ...shorthands.padding('2px', '8px'),
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
      color: '#fff',
    },
  },
  devToggleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    ...shorthands.borderColor('rgba(255,255,255,0.5)'),
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
  const { isLoading, error, dataService, dataServiceMode } = useAppContext();

  // Navigation domain services — created here so they're available to the provider
  const projectService = React.useMemo(
    () => dataServiceMode === 'mock' ? new MockProjectService() : new ProjectService(dataService),
    [dataService, dataServiceMode]
  );
  const userProfileService = React.useMemo(
    () => dataServiceMode === 'mock' ? new MockUserProfileService() : new UserProfileService(),
    [dataServiceMode]
  );

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
    <NavigationServicesProvider projectService={projectService} userProfileService={userProfileService}>
      <AppShellContent>{children}</AppShellContent>
    </NavigationServicesProvider>
  );
};

/**
 * Inner shell content — rendered inside NavigationServicesProvider so hooks
 * like useSwitchProject → useProjectProfile → useNavigationServices work.
 */
const AppShellContent: React.FC<IAppShellProps> = ({ children }) => {
  const styles = useStyles();
  const motionStyles = useHbcMotionStyles();
  const { currentUser, dataService, isFeatureEnabled, isFullScreen, toggleFullScreen, exitFullScreen, isOnline, setSelectedProject, dataServiceMode, selectedProject } = useAppContext();
  const { isMobile, isTablet } = useResponsive();
  const { setCurrentModuleKey, isHelpPanelOpen, helpPanelMode, startTour: startHelpTour, isTourActive } = useHelp();
  const currentModuleKey = useCurrentModule();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = React.useState(false);
  const [devNavOverride, setDevNavOverride] = React.useState(false);
  const appNavigate = useTransitionNavigate();
  const { leads } = useLeads();
  const { switchProject } = useSwitchProject();
  const { userProfileService } = useNavigationServices();

  // Computed: enhanced nav enabled via feature flag OR dev toggle (mock only)
  const isEnhancedNavEnabled = isFeatureEnabled('uxEnhancedNavigationV1') || devNavOverride;

  // Project commands for enhanced command palette — favorites first, then recent, then rest
  const projectCommands = React.useMemo<IHbcCommandPaletteCommand[]>(() => {
    if (!isEnhancedNavEnabled) return [];
    const email = currentUser?.email ?? '';
    const profile = email ? userProfileService.getNavProfile(email) : { favorites: [], recent: [] };

    const allProjects = leads
      .filter(l => l.ProjectCode && isActiveStage(l.Stage))
      .map(l => ({
        projectCode: l.ProjectCode!,
        projectName: l.Title,
        stage: l.Stage,
        region: l.Region,
        division: l.Division,
        leadId: l.id,
      }));

    // Order: favorites first, then recent, then rest
    const favSet = new Set(profile.favorites);
    const recentSet = new Set(profile.recent);
    const scored = allProjects.map(p => ({
      ...p,
      priority: favSet.has(p.projectCode) ? 0 : recentSet.has(p.projectCode) ? 1 : 2,
    }));
    scored.sort((a, b) => a.priority - b.priority);

    return scored.slice(0, 25).map(p => ({
      id: `project-${p.projectCode}`,
      label: `Switch to ${p.projectName}`,
      keywords: [p.projectCode, p.projectName, p.region || '', p.division || ''].filter(Boolean),
      section: 'Projects',
      run: () => {
        const project: ISelectedProject = {
          projectCode: p.projectCode,
          projectName: p.projectName,
          stage: p.stage,
          region: p.region,
          division: p.division,
          leadId: p.leadId,
        };
        switchProject({ project });
      },
    }));
  }, [leads, isEnhancedNavEnabled, switchProject, currentUser?.email, userProfileService]);

  // Navigation commands for enhanced command palette
  const navCommands = React.useMemo<IHbcCommandPaletteCommand[]>(() => {
    if (!isEnhancedNavEnabled) return [];
    return [
      { id: 'nav-dashboard', label: 'Go to Dashboard', keywords: ['home'], section: 'Navigation', run: () => appNavigate('/') },
      { id: 'nav-pipeline', label: 'Go to Pipeline', keywords: ['pipeline', 'leads'], section: 'Navigation', run: () => appNavigate('/preconstruction/pipeline') },
      { id: 'nav-precon', label: 'Go to Estimating Dashboard', keywords: ['estimating', 'preconstruction'], section: 'Navigation', run: () => appNavigate('/preconstruction') },
      { id: 'nav-marketing', label: 'Go to Marketing', keywords: ['marketing'], section: 'Navigation', run: () => appNavigate('/marketing') },
      { id: 'nav-project', label: 'Go to Project Dashboard', keywords: ['project', 'operations'], section: 'Navigation', run: () => appNavigate('/operations/project') },
      { id: 'nav-buyout', label: 'Go to Buyout Log', keywords: ['buyout', 'log'], section: 'Navigation', run: () => appNavigate('/operations/buyout-log') },
      { id: 'nav-schedule', label: 'Go to Schedule', keywords: ['schedule', 'gantt'], section: 'Navigation', run: () => appNavigate('/operations/schedule') },
      { id: 'nav-admin', label: 'Go to Admin Panel', keywords: ['admin', 'settings'], section: 'Navigation', run: () => appNavigate('/admin') },
    ];
  }, [isEnhancedNavEnabled, appNavigate]);

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
    ...projectCommands,
    ...navCommands,
  ], [currentModuleKey, isFullScreen, mobileNavOpen, startHelpTour, toggleFullScreen, navCommands, projectCommands]);

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

  // Load environment config if PermissionEngine is enabled.
  // Use boolean dep instead of isFeatureEnabled function ref to prevent
  // unnecessary re-fetches when only callback identity changes.
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
          {isMobile && !(isEnhancedNavEnabled) && (
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
          {!isMobile && isEnhancedNavEnabled && <PillarTabBar />}
        </div>

        {!isMobile && <SearchBar />}

        <div className={styles.headerRight}>
          {isEnhancedNavEnabled && <MacBarStatusPill />}
          {dataServiceMode === 'mock' && (
            <button
              onClick={() => setDevNavOverride(prev => !prev)}
              className={mergeClasses(styles.devToggle, devNavOverride && styles.devToggleActive)}
              title={devNavOverride ? 'Disable Enhanced Navigation (Dev Only)' : 'Enable Enhanced Navigation (Dev Only)'}
              aria-label={devNavOverride ? 'Disable Enhanced Navigation' : 'Enable Enhanced Navigation'}
            >
              Nav V2 {devNavOverride ? 'ON' : 'OFF'}
            </button>
          )}
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
            isMobile && isEnhancedNavEnabled && styles.mainMobileBottomNav,
            enableMotion ? motionStyles.routeTransition : undefined
          )}
          style={{ position: 'relative' }}
        >
          {isEnhancedNavEnabled && <ShellHydrationOverlay />}
          {children}
        </main>
      </div>

      {isMobile && isEnhancedNavEnabled && (
        <MobileBottomNav
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      )}

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
