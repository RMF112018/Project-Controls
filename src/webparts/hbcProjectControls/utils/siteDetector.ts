export interface ISiteContext {
  siteUrl: string;
  hubSiteUrl?: string;
  isHubSite: boolean;
  projectCode?: string;
}

export function detectSiteContext(
  currentSiteUrl: string,
  hubSiteUrl: string | undefined
): ISiteContext {
  const normalizedUrl = currentSiteUrl.toLowerCase().replace(/\/$/, '');

  // Check if current site IS the hub site
  if (hubSiteUrl && normalizedUrl === hubSiteUrl.toLowerCase().replace(/\/$/, '')) {
    return {
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: true,
    };
  }

  // If associated with hub, try to extract project code from URL
  if (hubSiteUrl) {
    const urlParts = currentSiteUrl.split('/');
    const siteName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    const projectCodeMatch = siteName.match(/(\d{2}-\d{3}-\d{2})/);

    return {
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: false,
      projectCode: projectCodeMatch ? projectCodeMatch[1] : undefined,
    };
  }

  // Default
  return {
    siteUrl: currentSiteUrl,
    isHubSite: true,
  };
}
