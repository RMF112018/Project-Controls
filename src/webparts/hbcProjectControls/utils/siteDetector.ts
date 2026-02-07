import { RenderMode } from '../models/enums';

export interface ISiteContext {
  renderMode: RenderMode;
  siteUrl: string;
  hubSiteUrl?: string;
  isHubSite: boolean;
  isProjectSite: boolean;
  isPreconSite: boolean;
  projectCode?: string;
}

export function detectSiteContext(
  currentSiteUrl: string,
  hubSiteUrl: string | undefined,
  configEntries: Array<{ SiteURL: string; RenderMode: string }>
): ISiteContext {
  const normalizedUrl = currentSiteUrl.toLowerCase().replace(/\/$/, '');

  // Check App_Context_Config for explicit mapping
  const configMatch = configEntries.find(
    c => normalizedUrl.includes(c.SiteURL.toLowerCase().replace(/\/$/, ''))
  );

  if (configMatch) {
    return {
      renderMode: configMatch.RenderMode as RenderMode,
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: configMatch.RenderMode === 'full',
      isProjectSite: configMatch.RenderMode === 'project',
      isPreconSite: configMatch.RenderMode === 'standalone',
    };
  }

  // Fallback: check if current site IS the hub site
  if (hubSiteUrl && normalizedUrl === hubSiteUrl.toLowerCase().replace(/\/$/, '')) {
    return {
      renderMode: RenderMode.Full,
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: true,
      isProjectSite: false,
      isPreconSite: false,
    };
  }

  // Fallback: if associated with hub, treat as project site
  if (hubSiteUrl) {
    // Try to extract project code from URL
    const urlParts = currentSiteUrl.split('/');
    const siteName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    const projectCodeMatch = siteName.match(/(\d{2}-\d{3}-\d{2})/);

    return {
      renderMode: RenderMode.Project,
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: false,
      isProjectSite: true,
      isPreconSite: false,
      projectCode: projectCodeMatch ? projectCodeMatch[1] : undefined,
    };
  }

  // Default: full mode
  return {
    renderMode: RenderMode.Full,
    siteUrl: currentSiteUrl,
    isHubSite: true,
    isProjectSite: false,
    isPreconSite: false,
  };
}

// For mock/demo mode
export function getMockSiteContext(mode: RenderMode): ISiteContext {
  switch (mode) {
    case RenderMode.Full:
      return {
        renderMode: RenderMode.Full,
        siteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
        hubSiteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
        isHubSite: true,
        isProjectSite: false,
        isPreconSite: false,
      };
    case RenderMode.Project:
      return {
        renderMode: RenderMode.Project,
        siteUrl: 'https://hedrickbrothers.sharepoint.com/sites/25-042-01',
        hubSiteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
        isHubSite: false,
        isProjectSite: true,
        isPreconSite: false,
        projectCode: '25-042-01',
      };
    case RenderMode.Standalone:
      return {
        renderMode: RenderMode.Standalone,
        siteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBPrecon',
        hubSiteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
        isHubSite: false,
        isProjectSite: false,
        isPreconSite: true,
      };
  }
}
