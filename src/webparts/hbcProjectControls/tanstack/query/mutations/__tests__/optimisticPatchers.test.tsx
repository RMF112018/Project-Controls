import {
  appendBuyoutEntryOptimistic,
  replaceBuyoutEntryOptimistic,
  removeBuyoutEntryOptimistic,
  mergePmpOptimistic,
} from '../optimisticPatchers';
import type { IBuyoutEntry, IProjectManagementPlan, IPMPBoilerplateSection } from '@hbc/sp-services';

function createMockBoilerplate(overrides: Partial<IPMPBoilerplateSection> = {}): IPMPBoilerplateSection {
  return {
    sectionNumber: '1',
    sectionTitle: 'Test Section',
    content: 'Default content',
    sourceDocumentUrl: '',
    lastSourceUpdate: '2026-01-01',
    ...overrides,
  };
}

function createMockBuyoutEntry(overrides: Partial<IBuyoutEntry> = {}): IBuyoutEntry {
  return {
    id: 1,
    projectCode: 'HBC-001',
    divisionCode: '05-120',
    divisionDescription: 'Structural Steel',
    isStandard: true,
    originalBudget: 100000,
    estimatedTax: 7000,
    totalBudget: 107000,
    enrolledInSDI: false,
    bondRequired: false,
    commitmentStatus: 'Draft',
    waiverRequired: false,
    approvalHistory: [],
    status: 'Not Started',
    createdDate: '2026-01-01',
    modifiedDate: '2026-01-01',
    ...overrides,
  } as IBuyoutEntry;
}

function createMockPmp(overrides: Partial<IProjectManagementPlan> = {}): IProjectManagementPlan {
  return {
    id: 1,
    projectCode: 'HBC-001',
    projectName: 'Test Project',
    jobNumber: 'J-100',
    status: 'Draft',
    currentCycleNumber: 1,
    division: 'Southeast',
    superintendentPlan: '',
    preconMeetingNotes: '',
    siteManagementNotes: '',
    projectAdminBuyoutDate: null,
    attachmentUrls: [],
    boilerplate: [
      createMockBoilerplate({ sectionNumber: '1', content: 'Section 1 content' }),
      createMockBoilerplate({ sectionNumber: '2', content: 'Section 2 content' }),
    ],
    lastUpdatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as IProjectManagementPlan;
}

describe('appendBuyoutEntryOptimistic', () => {
  it('appends entry and sorts by divisionCode', () => {
    const existing = [
      createMockBuyoutEntry({ id: 1, divisionCode: '02-300' }),
      createMockBuyoutEntry({ id: 2, divisionCode: '09-100' }),
    ];
    const newEntry = createMockBuyoutEntry({ id: 3, divisionCode: '05-120' });

    const result = appendBuyoutEntryOptimistic(existing, newEntry);

    expect(result).toHaveLength(3);
    expect(result[0].divisionCode).toBe('02-300');
    expect(result[1].divisionCode).toBe('05-120');
    expect(result[2].divisionCode).toBe('09-100');
  });

  it('does not mutate original array', () => {
    const existing = [createMockBuyoutEntry({ id: 1 })];
    const newEntry = createMockBuyoutEntry({ id: 2 });

    appendBuyoutEntryOptimistic(existing, newEntry);

    expect(existing).toHaveLength(1);
  });

  it('handles empty initial array', () => {
    const newEntry = createMockBuyoutEntry({ id: 1, divisionCode: '05-120' });

    const result = appendBuyoutEntryOptimistic([], newEntry);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('replaceBuyoutEntryOptimistic', () => {
  it('replaces matching entry by id', () => {
    const entries = [
      createMockBuyoutEntry({ id: 1, originalBudget: 100000 }),
      createMockBuyoutEntry({ id: 2, originalBudget: 200000 }),
    ];

    const result = replaceBuyoutEntryOptimistic(entries, 1, { originalBudget: 150000 });

    expect(result[0].originalBudget).toBe(150000);
    expect(result[1].originalBudget).toBe(200000);
  });

  it('leaves non-matching entries unchanged', () => {
    const entries = [
      createMockBuyoutEntry({ id: 1 }),
      createMockBuyoutEntry({ id: 2, subcontractorName: 'Sub A' }),
    ];

    const result = replaceBuyoutEntryOptimistic(entries, 1, { subcontractorName: 'Sub B' });

    expect(result[1].subcontractorName).toBe('Sub A');
  });

  it('returns same-length array when no match found', () => {
    const entries = [createMockBuyoutEntry({ id: 1 })];

    const result = replaceBuyoutEntryOptimistic(entries, 999, { originalBudget: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].originalBudget).toBe(100000);
  });

  it('does not mutate original array', () => {
    const entries = [createMockBuyoutEntry({ id: 1, originalBudget: 100000 })];

    replaceBuyoutEntryOptimistic(entries, 1, { originalBudget: 0 });

    expect(entries[0].originalBudget).toBe(100000);
  });
});

describe('removeBuyoutEntryOptimistic', () => {
  it('removes entry by id', () => {
    const entries = [
      createMockBuyoutEntry({ id: 1 }),
      createMockBuyoutEntry({ id: 2 }),
      createMockBuyoutEntry({ id: 3 }),
    ];

    const result = removeBuyoutEntryOptimistic(entries, 2);

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual([1, 3]);
  });

  it('returns full array when id not found', () => {
    const entries = [createMockBuyoutEntry({ id: 1 })];

    const result = removeBuyoutEntryOptimistic(entries, 999);

    expect(result).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = removeBuyoutEntryOptimistic([], 1);
    expect(result).toEqual([]);
  });
});

describe('mergePmpOptimistic', () => {
  it('merges patch into current PMP', () => {
    const current = createMockPmp({ superintendentPlan: 'Old plan' });

    const result = mergePmpOptimistic(current, { superintendentPlan: 'New plan' });

    expect(result).not.toBeNull();
    expect(result!.superintendentPlan).toBe('New plan');
    expect(result!.projectName).toBe('Test Project');
  });

  it('returns null when current is null', () => {
    const result = mergePmpOptimistic(null, { superintendentPlan: 'New' });
    expect(result).toBeNull();
  });

  it('updates lastUpdatedAt timestamp', () => {
    const current = createMockPmp({ lastUpdatedAt: '2026-01-01T00:00:00Z' });
    const before = new Date().toISOString();

    const result = mergePmpOptimistic(current, { siteManagementNotes: 'Updated' });

    expect(result!.lastUpdatedAt).not.toBe('2026-01-01T00:00:00Z');
    expect(result!.lastUpdatedAt >= before).toBe(true);
  });

  it('merges boilerplate sections by sectionNumber', () => {
    const current = createMockPmp({
      boilerplate: [
        createMockBoilerplate({ sectionNumber: '1', content: 'Original section 1' }),
        createMockBoilerplate({ sectionNumber: '2', content: 'Original section 2' }),
      ],
    });

    const result = mergePmpOptimistic(current, {
      boilerplate: [
        createMockBoilerplate({ sectionNumber: '1', content: 'Updated section 1' }),
      ],
    });

    expect(result!.boilerplate).toHaveLength(2);
    expect(result!.boilerplate[0].content).toBe('Updated section 1');
    expect(result!.boilerplate[1].content).toBe('Original section 2');
  });

  it('preserves original boilerplate when patch has no boilerplate', () => {
    const current = createMockPmp({
      boilerplate: [
        createMockBoilerplate({ sectionNumber: '1', content: 'Keep me' }),
      ],
    });

    const result = mergePmpOptimistic(current, { status: 'Approved' as IProjectManagementPlan['status'] });

    expect(result!.boilerplate[0].content).toBe('Keep me');
  });

  it('does not mutate original PMP', () => {
    const current = createMockPmp({ superintendentPlan: 'Original' });

    mergePmpOptimistic(current, { superintendentPlan: 'Changed' });

    expect(current.superintendentPlan).toBe('Original');
  });
});
