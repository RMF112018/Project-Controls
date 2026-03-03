export interface ITemplateEntry {
  id: string;
  templateName: string;
  sourcePath: string;
  targetFolder: string;
  fileName: string;
  division: 'Both' | 'Commercial' | 'Luxury Residential';
  active: boolean;
  fileHash: string;          // sha256:{hex}
  fileSize: number;
  lastModifiedInTemplateSite: string;
}

export interface ITemplateRegistry {
  version: string;
  lastModified: string;
  lastModifiedBy: string;
  templates: ITemplateEntry[];
}

export interface ITemplateSiteConfig {
  id: number;
  templateSiteUrl: string;
  lastSnapshotHash: string;
  lastSnapshotDate: string;
  githubRepoOwner: string;
  githubRepoName: string;
  githubBranch: string;
  active: boolean;
}

export interface ITemplateManifestLog {
  id: number;
  syncDate: string;
  triggeredBy: string;
  diffSummary: { added: number; modified: number; removed: number };
  prNumber?: number;
  prUrl?: string;
  status: 'Pending' | 'Merged' | 'Closed';
}
