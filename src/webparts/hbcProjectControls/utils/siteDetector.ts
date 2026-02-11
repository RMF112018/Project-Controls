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

    // Try dashed format first (25-042-01)
    const dashedMatch = siteName.match(/(\d{2}-\d{3}-\d{2})/);
    let projectCode: string | undefined;
    if (dashedMatch) {
      projectCode = dashedMatch[1];
    } else {
      // Try dashless 7-digit format (2504201) — provisioned sites strip dashes
      const dashlessMatch = siteName.match(/(\d{7})/);
      if (dashlessMatch) {
        const d = dashlessMatch[1];
        projectCode = `${d.substring(0, 2)}-${d.substring(2, 5)}-${d.substring(5, 7)}`;
      }
    }

    return {
      siteUrl: currentSiteUrl,
      hubSiteUrl,
      isHubSite: false,
      projectCode,
    };
  }

  // Default
  return {
    siteUrl: currentSiteUrl,
    isHubSite: true,
  };
}
