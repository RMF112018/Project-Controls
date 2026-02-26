import { IDataService, ITemplateFileMetadata } from './IDataService';
import { ITemplateEntry, ITemplateRegistry } from '../models/ITemplateManifest';

export interface IDiffResult {
  added: ITemplateFileMetadata[];    // In Template Site, NOT in committed registry
  modified: ITemplateFileMetadata[]; // In both, but hash differs
  removed: ITemplateEntry[];         // In committed (active=true), NOT in Template Site
  unchanged: ITemplateEntry[];       // In both, hash matches
  hasChanges: boolean;
}

/**
 * TemplateSyncService — computes diff between live Template Site and committed registry.
 * Used by provisioning governance tooling to detect drift before creating a GitHub PR.
 */
export class TemplateSyncService {
  constructor(private dataService: IDataService) {}

  async computeDiff(): Promise<IDiffResult> {
    const [committedRegistry, liveFiles]: [ITemplateRegistry, ITemplateFileMetadata[]] = await Promise.all([
      this.dataService.getCommittedTemplateRegistry(),
      this.dataService.getTemplateSiteFiles(),
    ]);

    const committedByPath = new Map<string, ITemplateEntry>(
      committedRegistry.templates.map(t => [t.sourcePath, t])
    );
    const liveByPath = new Map<string, ITemplateFileMetadata>(
      liveFiles.map(f => [f.sourcePath, f])
    );

    const added: ITemplateFileMetadata[] = [];
    const modified: ITemplateFileMetadata[] = [];
    const removed: ITemplateEntry[] = [];
    const unchanged: ITemplateEntry[] = [];

    for (const [path, live] of liveByPath) {
      const committed = committedByPath.get(path);
      if (!committed) {
        added.push(live);
      } else if (committed.fileHash !== live.fileHash) {
        modified.push(live);
      } else {
        unchanged.push(committed);
      }
    }

    for (const [path, committed] of committedByPath) {
      if (!liveByPath.has(path) && committed.active) {
        removed.push(committed);
      }
    }

    return {
      added,
      modified,
      removed,
      unchanged,
      hasChanges: added.length + modified.length + removed.length > 0,
    };
  }
}
