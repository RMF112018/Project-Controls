import {
  ALL_KICKOFF_SECTION_CONFIGS,
  KICKOFF_SECTION_PROJECT_INFO,
  KICKOFF_SECTION_MANAGING,
  KICKOFF_SECTION_KEY_DATES,
  KICKOFF_SECTION_DELIVERABLES_STANDARD,
  KICKOFF_SECTION_DELIVERABLES_NONSTANDARD,
} from '../utils/kickoffSectionConfigs';
import type { KickoffColumnEditorType } from '../models/IKickoffConfig';

const VALID_EDITOR_TYPES: KickoffColumnEditorType[] = [
  'text', 'date', 'datetime', 'select', 'checkbox',
  'yes-no-na', 'number', 'people', 'readonly',
  'status-select', 'phone', 'email', 'textarea',
];

describe('kickoffSectionConfigs', () => {
  it('exports exactly 5 section configs in Excel order', () => {
    expect(ALL_KICKOFF_SECTION_CONFIGS).toHaveLength(5);
    expect(ALL_KICKOFF_SECTION_CONFIGS.map(c => c.sectionKey)).toEqual([
      'project_info',
      'managing',
      'key_dates',
      'deliverables_standard',
      'deliverables_nonstandard',
    ]);
  });

  it('each config has a non-empty title and at least 2 columns', () => {
    for (const config of ALL_KICKOFF_SECTION_CONFIGS) {
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.columns.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all column editorTypes are valid', () => {
    for (const config of ALL_KICKOFF_SECTION_CONFIGS) {
      for (const col of config.columns) {
        expect(VALID_EDITOR_TYPES).toContain(col.editorType);
      }
    }
  });

  it('PROJECT INFORMATION has hideHeader, label + value columns, and editorTypeOverrides', () => {
    expect(KICKOFF_SECTION_PROJECT_INFO.hideHeader).toBe(true);
    expect(KICKOFF_SECTION_PROJECT_INFO.columns).toHaveLength(2);
    expect(KICKOFF_SECTION_PROJECT_INFO.columns[0].key).toBe('task');
    expect(KICKOFF_SECTION_PROJECT_INFO.columns[0].editorType).toBe('readonly');
    expect(KICKOFF_SECTION_PROJECT_INFO.columns[1].key).toBe('value');
    expect(KICKOFF_SECTION_PROJECT_INFO.columns[1].editorType).toBe('text');
    expect(KICKOFF_SECTION_PROJECT_INFO.allowCustomRows).toBe(false);

    // editorTypeOverrides should have 14 keys
    const overrides = KICKOFF_SECTION_PROJECT_INFO.editorTypeOverrides;
    expect(overrides).toBeDefined();
    expect(Object.keys(overrides!)).toHaveLength(14);

    // Spot-check specific overrides
    expect(overrides!['Title'].editorType).toBe('readonly');
    expect(overrides!['ProjectCode'].editorType).toBe('readonly');
    expect(overrides!['ProposalDueDateTime'].editorType).toBe('datetime');
    expect(overrides!['RFIFormat'].editorType).toBe('select');
    expect(overrides!['RFIFormat'].options).toEqual(['Excel', 'Procore', 'Other']);
    expect(overrides!['OwnerContactPhone'].editorType).toBe('phone');
    expect(overrides!['OwnerContactEmail'].editorType).toBe('email');
    expect(overrides!['CopiesIfHandDelivered'].editorType).toBe('number');
  });

  it('MANAGING INFORMATION has 5 columns: task, status, responsible, deadline, notes', () => {
    expect(KICKOFF_SECTION_MANAGING.columns).toHaveLength(5);
    const keys = KICKOFF_SECTION_MANAGING.columns.map(c => c.key);
    expect(keys).toEqual(['task', 'status', 'responsibleParty', 'deadline', 'notes']);
    expect(KICKOFF_SECTION_MANAGING.allowCustomRows).toBe(true);
    expect(KICKOFF_SECTION_MANAGING.allowRowRemoval).toBe(true);
  });

  it('KEY DATES has title "Key Dates", 4 columns with datetime deadline and textarea notes', () => {
    expect(KICKOFF_SECTION_KEY_DATES.title).toBe('Key Dates');
    expect(KICKOFF_SECTION_KEY_DATES.columns).toHaveLength(4);
    const keys = KICKOFF_SECTION_KEY_DATES.columns.map(c => c.key);
    expect(keys).toEqual(['task', 'responsibleParty', 'deadline', 'notes']);
    expect(KICKOFF_SECTION_KEY_DATES.columns[0].header).toBe('Estimate Preparation');
    expect(KICKOFF_SECTION_KEY_DATES.columns[2].editorType).toBe('datetime');
    expect(KICKOFF_SECTION_KEY_DATES.columns[3].editorType).toBe('textarea');
    expect(KICKOFF_SECTION_KEY_DATES.allowCustomRows).toBe(false);
  });

  it('DELIVERABLES STANDARD has 6 columns with deliverableStatus, no tabRequired column', () => {
    expect(KICKOFF_SECTION_DELIVERABLES_STANDARD.columns).toHaveLength(6);
    const keys = KICKOFF_SECTION_DELIVERABLES_STANDARD.columns.map(c => c.key);
    expect(keys).toEqual(['task', 'status', 'deliverableStatus', 'responsibleParty', 'deadline', 'notes']);
    // No tabRequired column
    expect(keys).not.toContain('tabRequired');
    // status header renamed to "Required"
    expect(KICKOFF_SECTION_DELIVERABLES_STANDARD.columns[1].header).toBe('Required');
    // deliverableStatus column is status-select
    const dsCol = KICKOFF_SECTION_DELIVERABLES_STANDARD.columns[2];
    expect(dsCol.editorType).toBe('status-select');
    expect(dsCol.dependsOnColumn).toBe('status');
    expect(dsCol.enabledWhenValue).toBe('yes');
    // deadline is datetime, notes is textarea
    expect(KICKOFF_SECTION_DELIVERABLES_STANDARD.columns[4].editorType).toBe('datetime');
    expect(KICKOFF_SECTION_DELIVERABLES_STANDARD.columns[5].editorType).toBe('textarea');
    expect(KICKOFF_SECTION_DELIVERABLES_STANDARD.allowCustomRows).toBe(true);
  });

  it('DELIVERABLES NON-STANDARD has 6 columns with Deliverable header and deliverableStatus', () => {
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns).toHaveLength(6);
    const keys = KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns.map(c => c.key);
    expect(keys).toEqual(['task', 'status', 'deliverableStatus', 'responsibleParty', 'deadline', 'notes']);
    // task header is "Deliverable"
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns[0].header).toBe('Deliverable');
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns[0].editorType).toBe('text');
    // status header renamed to "Required"
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns[1].header).toBe('Required');
    // deliverableStatus column
    const dsCol = KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.columns[2];
    expect(dsCol.editorType).toBe('status-select');
    expect(dsCol.dependsOnColumn).toBe('status');
    expect(dsCol.enabledWhenValue).toBe('yes');
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.allowCustomRows).toBe(true);
    expect(KICKOFF_SECTION_DELIVERABLES_NONSTANDARD.maxCustomRows).toBe(10);
  });

  it('status-select columns have dependsOnColumn and enabledWhenValue', () => {
    for (const config of ALL_KICKOFF_SECTION_CONFIGS) {
      for (const col of config.columns) {
        if (col.editorType === 'status-select') {
          expect(col.dependsOnColumn).toBeDefined();
          expect(col.enabledWhenValue).toBeDefined();
          expect(col.options).toBeDefined();
          expect(col.options!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('all configs default to expanded', () => {
    for (const config of ALL_KICKOFF_SECTION_CONFIGS) {
      expect(config.defaultExpanded).toBe(true);
    }
  });
});
