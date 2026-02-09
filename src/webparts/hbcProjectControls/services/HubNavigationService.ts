/**
 * HubNavigationService — Manages hub site top navigation links for project sites.
 *
 * Standalone service (NOT part of IDataService). SP-specific infrastructure.
 * Contains interface, types, helpers, and two implementations (Mock + SharePoint).
 */

// --- Types ---

export interface IHubNavResult {
  success: boolean;
  action: 'created' | 'updated' | 'removed' | 'skipped' | 'failed';
  yearLabel: string;
  projectCode: string;
  error?: string;
}

export interface IHubNavNode {
  id: string;
  title: string;
  url: string;
  children: IHubNavNode[];
}

export interface IHubNavigationService {
  addProjectNavigationLink(
    hubSiteUrl: string,
    projectCode: string,
    projectName: string,
    projectSiteUrl: string
  ): Promise<IHubNavResult>;

  removeProjectNavigationLink(
    hubSiteUrl: string,
    projectCode: string
  ): Promise<IHubNavResult>;

  getYearNavigationLinks(hubSiteUrl: string): Promise<IHubNavNode[]>;
}

// --- Helper Functions ---

/**
 * Derive year label from project code prefix.
 * "25-042-01" → "2025 Projects"
 * "26-001-01" → "2026 Projects"
 */
export function projectCodeToYearLabel(projectCode: string): string {
  const prefix = projectCode.substring(0, 2);
  const year = parseInt(prefix, 10);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  return `${fullYear} Projects`;
}

/**
 * Build display text for a nav link.
 * "25-042-01" + "Coral Ridge Tower" → "25-042-01 — Coral Ridge Tower"
 */
export function buildNavLinkDisplayText(projectCode: string, projectName: string): string {
  return `${projectCode} \u2014 ${projectName}`;
}

// --- Mock Implementation ---

export class MockHubNavigationService implements IHubNavigationService {
  private navTree: IHubNavNode[] = [];
  private nextId = 1;

  async addProjectNavigationLink(
    _hubSiteUrl: string,
    projectCode: string,
    projectName: string,
    projectSiteUrl: string
  ): Promise<IHubNavResult> {
    const yearLabel = projectCodeToYearLabel(projectCode);
    const displayText = buildNavLinkDisplayText(projectCode, projectName);

    // Find or create year group node
    let yearNode = this.navTree.find(n => n.title === yearLabel);
    if (!yearNode) {
      yearNode = {
        id: `year-${this.nextId++}`,
        title: yearLabel,
        url: '',
        children: [],
      };
      this.navTree.push(yearNode);
      // Sort year groups chronologically
      this.navTree.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Check for existing link (idempotent update)
    const existingIdx = yearNode.children.findIndex(
      c => c.url === projectSiteUrl || c.title.startsWith(projectCode)
    );

    let action: IHubNavResult['action'];
    if (existingIdx >= 0) {
      yearNode.children[existingIdx] = {
        ...yearNode.children[existingIdx],
        title: displayText,
        url: projectSiteUrl,
      };
      action = 'updated';
    } else {
      yearNode.children.push({
        id: `nav-${this.nextId++}`,
        title: displayText,
        url: projectSiteUrl,
        children: [],
      });
      action = 'created';
    }

    // Sort children by project code (numeric sort)
    yearNode.children.sort((a, b) => a.title.localeCompare(b.title));

    console.log(`[MockHubNavigationService] addProjectNavigationLink: ${action} "${displayText}" under "${yearLabel}"`);

    return { success: true, action, yearLabel, projectCode };
  }

  async removeProjectNavigationLink(
    _hubSiteUrl: string,
    projectCode: string
  ): Promise<IHubNavResult> {
    const yearLabel = projectCodeToYearLabel(projectCode);
    const yearNode = this.navTree.find(n => n.title === yearLabel);

    if (!yearNode) {
      return { success: true, action: 'skipped', yearLabel, projectCode };
    }

    const idx = yearNode.children.findIndex(c => c.title.startsWith(projectCode));
    if (idx === -1) {
      return { success: true, action: 'skipped', yearLabel, projectCode };
    }

    yearNode.children.splice(idx, 1);

    // Remove empty year group
    if (yearNode.children.length === 0) {
      const yearIdx = this.navTree.indexOf(yearNode);
      if (yearIdx >= 0) this.navTree.splice(yearIdx, 1);
    }

    console.log(`[MockHubNavigationService] removeProjectNavigationLink: removed "${projectCode}" from "${yearLabel}"`);

    return { success: true, action: 'removed', yearLabel, projectCode };
  }

  async getYearNavigationLinks(_hubSiteUrl: string): Promise<IHubNavNode[]> {
    return JSON.parse(JSON.stringify(this.navTree));
  }
}

// --- SharePoint Implementation (Stub) ---

/**
 * SharePoint implementation using PnP JS sp.web.navigation.topNavigationBar.
 * TODO: Implement when connecting to real SharePoint.
 */
export class SharePointHubNavigationService implements IHubNavigationService {
  async addProjectNavigationLink(
    _hubSiteUrl: string,
    _projectCode: string,
    _projectName: string,
    _projectSiteUrl: string
  ): Promise<IHubNavResult> {
    // TODO: Use PnP JS sp.web.navigation.topNavigationBar to:
    // 1. Find or create year group header node
    // 2. Add/update project link as child node
    // 3. Sort children by project code
    throw new Error('SharePoint implementation pending');
  }

  async removeProjectNavigationLink(
    _hubSiteUrl: string,
    _projectCode: string
  ): Promise<IHubNavResult> {
    // TODO: Use PnP JS to find and remove the navigation node
    throw new Error('SharePoint implementation pending');
  }

  async getYearNavigationLinks(_hubSiteUrl: string): Promise<IHubNavNode[]> {
    // TODO: Use PnP JS to read top navigation bar nodes
    throw new Error('SharePoint implementation pending');
  }
}
