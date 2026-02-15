import * as React from 'react';
import { IHelpGuide, ISupportConfig } from '@hbc/sp-services';
import { useAppContext } from './AppContext';

export type HelpPanelMode = 'targeted' | 'library';

export interface IHelpContextValue {
  guides: IHelpGuide[];
  supportConfig: ISupportConfig | null;
  isHelpPanelOpen: boolean;
  helpPanelMode: HelpPanelMode;
  isTourActive: boolean;
  tourModuleKey: string | null;
  currentModuleKey: string | null;
  isLoading: boolean;
  isContactSupportOpen: boolean;
  openHelpPanel: (mode?: HelpPanelMode) => void;
  closeHelpPanel: () => void;
  startTour: (moduleKey?: string) => void;
  endTour: () => void;
  setCurrentModuleKey: (key: string | null) => void;
  refreshGuides: () => Promise<void>;
  openContactSupport: () => void;
  closeContactSupport: () => void;
}

const HelpContext = React.createContext<IHelpContextValue | undefined>(undefined);

interface IHelpProviderProps {
  children: React.ReactNode;
}

export const HelpProvider: React.FC<IHelpProviderProps> = ({ children }) => {
  const { dataService, isFeatureEnabled } = useAppContext();
  const enabled = isFeatureEnabled('EnableHelpSystem');

  const [guides, setGuides] = React.useState<IHelpGuide[]>([]);
  const [supportConfig, setSupportConfig] = React.useState<ISupportConfig | null>(null);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = React.useState(false);
  const [isTourActive, setIsTourActive] = React.useState(false);
  const [tourModuleKey, setTourModuleKey] = React.useState<string | null>(null);
  const [currentModuleKey, setCurrentModuleKey] = React.useState<string | null>(null);
  const [helpPanelMode, setHelpPanelMode] = React.useState<HelpPanelMode>('targeted');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = React.useState(false);

  const loadGuides = React.useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [fetchedGuides, config] = await Promise.all([
        dataService.getHelpGuides(),
        dataService.getSupportConfig(),
      ]);
      setGuides(fetchedGuides);
      setSupportConfig(config);
    } catch (err) {
      console.error('Failed to load help guides:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dataService, enabled]);

  React.useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  const openHelpPanel = React.useCallback((mode: HelpPanelMode = 'targeted') => {
    setHelpPanelMode(mode);
    setIsHelpPanelOpen(true);
  }, []);
  const closeHelpPanel = React.useCallback(() => setIsHelpPanelOpen(false), []);
  const startTour = React.useCallback((moduleKey?: string) => {
    setTourModuleKey(moduleKey ?? currentModuleKey);
    setIsTourActive(true);
  }, [currentModuleKey]);
  const endTour = React.useCallback(() => {
    setIsTourActive(false);
    setTourModuleKey(null);
  }, []);
  const openContactSupport = React.useCallback(() => setIsContactSupportOpen(true), []);
  const closeContactSupport = React.useCallback(() => setIsContactSupportOpen(false), []);

  const value = React.useMemo<IHelpContextValue>(
    () => ({
      guides,
      supportConfig,
      isHelpPanelOpen,
      helpPanelMode,
      isTourActive,
      tourModuleKey,
      currentModuleKey,
      isLoading,
      isContactSupportOpen,
      openHelpPanel,
      closeHelpPanel,
      startTour,
      endTour,
      setCurrentModuleKey,
      refreshGuides: loadGuides,
      openContactSupport,
      closeContactSupport,
    }),
    [guides, supportConfig, isHelpPanelOpen, helpPanelMode, isTourActive, tourModuleKey, currentModuleKey, isLoading, isContactSupportOpen, openHelpPanel, closeHelpPanel, startTour, endTour, loadGuides, openContactSupport, closeContactSupport],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
};

export const useHelp = (): IHelpContextValue => {
  const ctx = React.useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return ctx;
};
