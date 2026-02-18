/**
 * TemplateSyncService — unit tests.
 * Validates diff computation between the committed template registry and
 * the live template site file list. Uses controlled mock data for every case.
 */
import { TemplateSyncService } from '../TemplateSyncService';
import { IDataService, ITemplateFileMetadata } from '../IDataService';
import { ITemplateEntry, ITemplateRegistry } from '../../models/ITemplateManifest';

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ITemplateEntry> & Pick<ITemplateEntry, 'id' | 'sourcePath'>): ITemplateEntry {
  return {
    templateName: overrides.id,
    targetFolder: 'Project Documents',
    fileName: `${overrides.id}.docx`,
    division: 'Both',
    active: true,
    fileHash: 'sha256:aabbcc',
    fileSize: 10240,
    lastModifiedInTemplateSite: '2026-01-15T10:00:00Z',
    ...overrides,
  } as ITemplateEntry;
}

function makeFileMeta(overrides: Partial<ITemplateFileMetadata> & Pick<ITemplateFileMetadata, 'sourcePath'>): ITemplateFileMetadata {
  return {
    fileName: 'file.docx',
    fileHash: 'sha256:aabbcc',
    fileSize: 10240,
    lastModified: '2026-01-15T10:00:00Z',
    division: 'Both',
    ...overrides,
  };
}

function makeRegistry(templates: ITemplateEntry[]): ITemplateRegistry {
  return {
    version: '1.0.0',
    lastModified: '2026-01-15T10:00:00Z',
    lastModifiedBy: 'test@hedrickbrothers.com',
    templates,
  };
}

function createMockDataService(
  committedTemplates: ITemplateEntry[],
  liveFiles: ITemplateFileMetadata[]
): Record<string, jest.Mock> {
  return {
    getCommittedTemplateRegistry: jest.fn().mockResolvedValue(makeRegistry(committedTemplates)),
    getTemplateSiteFiles: jest.fn().mockResolvedValue(liveFiles),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TemplateSyncService', () => {
  describe('computeDiff', () => {
    it('returns hasChanges=false when live hashes match committed registry', async () => {
      const entry = makeEntry({ id: 'tpl-001', sourcePath: 'Templates/file.docx', fileHash: 'sha256:match' });
      const live = makeFileMeta({ sourcePath: 'Templates/file.docx', fileHash: 'sha256:match' });
      const mockDs = createMockDataService([entry], [live]);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.hasChanges).toBe(false);
      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(1);
    });

    it('detects added: file in live site not in committed registry', async () => {
      const live = makeFileMeta({ sourcePath: 'Templates/NewFile.docx', fileHash: 'sha256:new' });
      const mockDs = createMockDataService([], [live]);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].sourcePath).toBe('Templates/NewFile.docx');
      expect(diff.hasChanges).toBe(true);
    });

    it('detects modified: same sourcePath, different fileHash', async () => {
      const entry = makeEntry({ id: 'tpl-001', sourcePath: 'Templates/file.docx', fileHash: 'sha256:old' });
      const live = makeFileMeta({ sourcePath: 'Templates/file.docx', fileHash: 'sha256:new' });
      const mockDs = createMockDataService([entry], [live]);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].sourcePath).toBe('Templates/file.docx');
      expect(diff.modified[0].fileHash).toBe('sha256:new');
      expect(diff.hasChanges).toBe(true);
    });

    it('detects removed: active entry in committed but missing from live site', async () => {
      const entry = makeEntry({ id: 'tpl-001', sourcePath: 'Templates/deleted.docx', active: true });
      const mockDs = createMockDataService([entry], []); // no live files
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].sourcePath).toBe('Templates/deleted.docx');
      expect(diff.hasChanges).toBe(true);
    });

    it('does NOT flag removed for active=false committed entries', async () => {
      const entry = makeEntry({ id: 'tpl-001', sourcePath: 'Templates/archived.docx', active: false });
      const mockDs = createMockDataService([entry], []); // not in live site either
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.removed).toHaveLength(0);
      expect(diff.hasChanges).toBe(false);
    });

    it('handles empty live site (all active committed entries flagged removed)', async () => {
      const entries = [
        makeEntry({ id: 'tpl-001', sourcePath: 'Templates/A.docx', active: true }),
        makeEntry({ id: 'tpl-002', sourcePath: 'Templates/B.docx', active: true }),
        makeEntry({ id: 'tpl-003', sourcePath: 'Templates/C.docx', active: false }), // inactive — not flagged
      ];
      const mockDs = createMockDataService(entries, []);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.removed).toHaveLength(2); // only the 2 active ones
      expect(diff.added).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(0);
      expect(diff.hasChanges).toBe(true);
    });

    it('handles empty committed registry (all live files flagged added)', async () => {
      const liveFiles = [
        makeFileMeta({ sourcePath: 'Templates/A.docx' }),
        makeFileMeta({ sourcePath: 'Templates/B.docx' }),
      ];
      const mockDs = createMockDataService([], liveFiles);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.added).toHaveLength(2);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(0);
      expect(diff.hasChanges).toBe(true);
    });

    it('unchanged count equals entries present in both with matching hashes', async () => {
      const hash = 'sha256:same';
      const entries = [
        makeEntry({ id: 'tpl-001', sourcePath: 'Templates/A.docx', fileHash: hash }),
        makeEntry({ id: 'tpl-002', sourcePath: 'Templates/B.docx', fileHash: hash }),
      ];
      const liveFiles = [
        makeFileMeta({ sourcePath: 'Templates/A.docx', fileHash: hash }),
        makeFileMeta({ sourcePath: 'Templates/B.docx', fileHash: hash }),
      ];
      const mockDs = createMockDataService(entries, liveFiles);
      const svc = new TemplateSyncService(mockDs as unknown as IDataService);

      const diff = await svc.computeDiff();

      expect(diff.unchanged).toHaveLength(2);
      expect(diff.hasChanges).toBe(false);
    });
  });
});
