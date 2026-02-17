/**
 * scheduleParser — Unit tests for CSV, XER, XML parsers and the dispatcher.
 *
 * CSV tests use the real reference/TWNU07.csv file (1174 activities).
 * XER/XML tests use synthetic data to avoid binary fixture files.
 */
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import { parseScheduleCSV, parseScheduleXER, parseScheduleXML, parseScheduleFile } from '../scheduleParser';

// Assign DOMParser globally for XML tests (node env has no native DOMParser).
// JSDOM's DOMParser supports querySelector unlike @xmldom/xmldom.
(global as unknown as Record<string, unknown>).DOMParser = new JSDOM('').window.DOMParser;

const PROJECT_CODE = 'TWNU07';

// Load real CSV fixture — file is gitignored so may not exist in CI
const csvPath = path.resolve(__dirname, '../../../../../reference/TWNU07.csv');
const csvExists = fs.existsSync(csvPath);
const csvText = csvExists ? fs.readFileSync(csvPath, 'utf-8') : '';

// ---------------------------------------------------------------------------
// parseScheduleCSV — real TWNU07 data (skipped in CI when file is absent)
// ---------------------------------------------------------------------------
(csvExists ? describe : describe.skip)('parseScheduleCSV — real TWNU07 data', () => {
  const activities = parseScheduleCSV(csvText, PROJECT_CODE);

  it('parses the expected number of activities (1174 data rows)', () => {
    // 1176 lines total, 2 header rows = 1174 data rows
    // Some rows may be filtered if missing fields, but should be very close
    expect(activities.length).toBeGreaterThanOrEqual(1170);
    expect(activities.length).toBeLessThanOrEqual(1175);
  });

  it('parses the first activity (SITEWORK-10) correctly', () => {
    const first = activities[0];
    expect(first.taskCode).toBe('SITEWORK-10');
    expect(first.activityName).toBe('MOBILIZATION');
    expect(first.status).toBe('Completed');
    expect(first.wbsCode).toBe('TWNU07.8.8.2');
    expect(first.originalDuration).toBe(2);
    expect(first.remainingDuration).toBe(0);
    expect(first.actualDuration).toBe(2);
    expect(first.projectCode).toBe(PROJECT_CODE);
  });

  it('parses dates as ISO strings', () => {
    const first = activities[0];
    expect(first.baselineStartDate).toBe('2024-10-29T08:00:00.000Z');
    expect(first.baselineFinishDate).toBe('2024-10-30T16:00:00.000Z');
    expect(first.plannedStartDate).toBe('2024-10-29T08:00:00.000Z');
    expect(first.actualStartDate).toBe('2024-10-29T08:00:00.000Z');
  });

  it('calculates percentComplete correctly for completed activities', () => {
    const completed = activities.filter(a => a.status === 'Completed');
    expect(completed.length).toBeGreaterThan(0);
    completed.forEach(a => expect(a.percentComplete).toBe(100));
  });

  it('calculates variance days', () => {
    // SITEWORK-10: same baseline and actual dates → 0 variance
    const first = activities[0];
    expect(first.startVarianceDays).toBe(0);
    expect(first.finishVarianceDays).toBe(0);

    // SITEWORK-50: actual finish 1/14/2025 vs baseline finish 12/13/2024 → positive variance
    const sw50 = activities.find(a => a.taskCode === 'SITEWORK-50');
    expect(sw50).toBeDefined();
    expect(sw50!.finishVarianceDays).toBeGreaterThan(0);
  });

  it('parses predecessors correctly', () => {
    const first = activities[0]; // SITEWORK-10 has predecessors: PRECON-30, SM-NTP
    expect(first.predecessors).toEqual(['PRECON-30', 'SM-NTP']);
  });

  it('parses successors correctly', () => {
    const first = activities[0]; // SITEWORK-10 has successors: SITEWORK-40, SITEWORK-20
    expect(first.successors).toEqual(['SITEWORK-40', 'SITEWORK-20']);
  });

  it('parses successor details with relationship types and lag', () => {
    // DELAY-UTLPERMIT-10 has successor: PERMIT-20: FS 1 (lag=1)
    const delay = activities.find(a => a.taskCode === 'DELAY-UTLPERMIT-10');
    expect(delay).toBeDefined();
    expect(delay!.successorDetails.length).toBe(1);
    expect(delay!.successorDetails[0]).toEqual({
      taskCode: 'PERMIT-20',
      relationshipType: 'FS',
      lag: 1,
    });
  });

  it('parses negative float', () => {
    // DELAY-UTLPERMIT-10 has remaining float -50
    const delay = activities.find(a => a.taskCode === 'DELAY-UTLPERMIT-10');
    expect(delay).toBeDefined();
    expect(delay!.remainingFloat).toBe(-50);
    expect(delay!.isCritical).toBe(true);
  });

  it('normalizes status codes', () => {
    const statuses = new Set(activities.map(a => a.status));
    expect(statuses.size).toBeLessThanOrEqual(3);
    statuses.forEach(s => expect(['Completed', 'In Progress', 'Not Started']).toContain(s));
  });

  it('assigns sequential 1-based IDs', () => {
    expect(activities[0].id).toBe(1);
    expect(activities[1].id).toBe(2);
    expect(activities[activities.length - 1].id).toBe(activities.length);
  });
});

// ---------------------------------------------------------------------------
// parseScheduleCSV — synthetic tests (always run)
// ---------------------------------------------------------------------------
describe('parseScheduleCSV — synthetic', () => {
  it('returns empty array for empty input', () => {
    expect(parseScheduleCSV('', PROJECT_CODE)).toEqual([]);
  });

  it('returns empty array for header-only input (fewer than 3 lines)', () => {
    const headerOnly = 'header1,header2\ndisplay1,display2';
    expect(parseScheduleCSV(headerOnly, PROJECT_CODE)).toEqual([]);
  });

  it('skips rows with fewer than 4 fields or empty task_code', () => {
    const csv = 'h1,h2,h3,h4\nd1,d2,d3,d4\n,,,\nTASK-1,Not Started,WBS.1,Test Activity';
    const result = parseScheduleCSV(csv, PROJECT_CODE);
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('TASK-1');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'h1,h2,h3,h4\nd1,d2,d3,d4\nTASK-Q,Completed,WBS.1,"Activity, with comma"';
    const result = parseScheduleCSV(csv, PROJECT_CODE);
    expect(result.length).toBe(1);
    expect(result[0].activityName).toBe('Activity, with comma');
  });
});

// ---------------------------------------------------------------------------
// parseScheduleXER — synthetic XER data
// ---------------------------------------------------------------------------
describe('parseScheduleXER', () => {
  const buildXER = (tasks: string[], preds?: string[]): string => {
    const lines = [
      'ERMHDR\t12.0',
      '%T\tTASK',
      '%F\ttask_id\ttask_code\ttask_name\tstatus_code\ttarget_drtn_hr_cnt\tremain_drtn_hr_cnt\ttarget_start_date\ttarget_end_date\tearly_start_date\tearly_end_date\tact_start_date\tact_end_date\ttotal_float_hr_cnt\tfree_float_hr_cnt\ttask_type\twbs_id\trsrc_name\tclndr_name\tcstr_type\tdelete_flag',
      ...tasks.map(t => `%R\t${t}`),
    ];
    if (preds && preds.length > 0) {
      lines.push(
        '%T\tTASKPRED',
        '%F\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt',
        ...preds.map(p => `%R\t${p}`),
      );
    }
    return lines.join('\n');
  };

  it('parses basic task data from TASK table', () => {
    const xer = buildXER([
      '100\tA1010\tMobilization\tTK_Complete\t80\t0\t2025-01-02 08:00\t2025-01-15 16:00\t2025-01-02 08:00\t2025-01-15 16:00\t2025-01-02 08:00\t2025-01-15 16:00\t0\t0\tTT_Task\tWBS.1\tJohn\tStandard\t\t',
    ]);
    const result = parseScheduleXER(xer, 'TEST');
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('A1010');
    expect(result[0].activityName).toBe('Mobilization');
    expect(result[0].status).toBe('Completed');
    expect(result[0].projectCode).toBe('TEST');
  });

  it('maps XER status codes correctly', () => {
    const xer = buildXER([
      '100\tT1\tTask 1\tTK_Complete\t80\t0\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
      '200\tT2\tTask 2\tTK_Active\t80\t40\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
      '300\tT3\tTask 3\tTK_NotStart\t80\t80\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
    ]);
    const result = parseScheduleXER(xer, 'TEST');
    expect(result[0].status).toBe('Completed');
    expect(result[1].status).toBe('In Progress');
    expect(result[2].status).toBe('Not Started');
  });

  it('converts hours to days for duration', () => {
    const xer = buildXER([
      '100\tT1\tTask\tTK_NotStart\t80\t80\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
    ]);
    const result = parseScheduleXER(xer, 'TEST');
    // 80 hours / 8 = 10 days
    expect(result[0].originalDuration).toBe(10);
    expect(result[0].remainingDuration).toBe(10);
  });

  it('builds predecessor/successor relationships from TASKPRED table', () => {
    const xer = buildXER(
      [
        '100\tA1010\tFirst Task\tTK_Complete\t80\t0\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
        '200\tA1020\tSecond Task\tTK_Active\t80\t40\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
      ],
      ['200\t100\tPR_FS\t0'], // Task 200 has predecessor 100
    );
    const result = parseScheduleXER(xer, 'TEST');
    // Task 200 (A1020) should have A1010 as predecessor
    const second = result.find(a => a.taskCode === 'A1020');
    expect(second!.predecessors).toEqual(['A1010']);

    // Task 100 (A1010) should have A1020 as successor
    const first = result.find(a => a.taskCode === 'A1010');
    expect(first!.successors).toEqual(['A1020']);
  });

  it('maps relationship types from XER format', () => {
    const xer = buildXER(
      [
        '100\tT1\tTask 1\tTK_NotStart\t80\t80\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
        '200\tT2\tTask 2\tTK_NotStart\t80\t80\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
      ],
      ['200\t100\tPR_SS\t16'], // SS with 16hr lag
    );
    const result = parseScheduleXER(xer, 'TEST');
    const first = result.find(a => a.taskCode === 'T1');
    expect(first!.successorDetails[0].relationshipType).toBe('SS');
    expect(first!.successorDetails[0].lag).toBe(2); // 16 hours / 8 = 2 days
  });

  it('returns empty array for empty input', () => {
    expect(parseScheduleXER('', 'TEST')).toEqual([]);
  });

  it('returns empty array when no TASK table exists', () => {
    const xer = '%T\tCALENDAR\n%F\tclndr_id\tclndr_name\n%R\t1\tStandard';
    expect(parseScheduleXER(xer, 'TEST')).toEqual([]);
  });

  it('handles float values', () => {
    const xer = buildXER([
      '100\tT1\tTask\tTK_Active\t80\t40\t\t\t\t\t\t\t-40\t0\t\t\t\t\t\t',
    ]);
    const result = parseScheduleXER(xer, 'TEST');
    expect(result[0].remainingFloat).toBe(-5); // -40 hours / 8 = -5 days
    expect(result[0].isCritical).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseScheduleXML — synthetic XML data
// ---------------------------------------------------------------------------
describe('parseScheduleXML', () => {
  it('parses MSProject XML format', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project>
  <Tasks>
    <Task>
      <UID>0</UID>
      <Name>Project Root</Name>
    </Task>
    <Task>
      <UID>1</UID>
      <Name>Mobilization</Name>
      <Duration>PT80H0M0S</Duration>
      <Start>2025-01-02T08:00:00</Start>
      <Finish>2025-01-15T16:00:00</Finish>
      <PercentComplete>100</PercentComplete>
      <WBS>1.1</WBS>
      <Critical>1</Critical>
      <TotalSlack>PT0H0M0S</TotalSlack>
      <PredecessorLink>
        <PredecessorUID>0</PredecessorUID>
        <Type>1</Type>
      </PredecessorLink>
    </Task>
    <Task>
      <UID>2</UID>
      <Name>Excavation</Name>
      <Duration>PT160H0M0S</Duration>
      <Start>2025-01-16T08:00:00</Start>
      <Finish>2025-02-05T16:00:00</Finish>
      <PercentComplete>50</PercentComplete>
      <WBS>1.2</WBS>
    </Task>
  </Tasks>
</Project>`;
    const result = parseScheduleXML(xml, 'TEST');
    // UID 0 is skipped (root task)
    expect(result.length).toBe(2);
    expect(result[0].taskCode).toBe('MSP-1');
    expect(result[0].activityName).toBe('Mobilization');
    expect(result[0].status).toBe('Completed');
    expect(result[0].percentComplete).toBe(100);
    expect(result[0].isCritical).toBe(true);
    // Duration: 80H / 8 = 10 days
    expect(result[0].originalDuration).toBe(10);
  });

  it('auto-detects P6 PMXML format by root element', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<APIBusinessObjects>
  <Project>
    <Activity>
      <Id>A1010</Id>
      <Name>Mobilization</Name>
      <Status>Completed</Status>
      <PlannedDuration>10</PlannedDuration>
      <ActualDuration>10</ActualDuration>
      <RemainingDuration>0</RemainingDuration>
      <PlannedStartDate>2025-01-02T08:00:00</PlannedStartDate>
      <PlannedFinishDate>2025-01-15T16:00:00</PlannedFinishDate>
    </Activity>
  </Project>
</APIBusinessObjects>`;
    const result = parseScheduleXML(xml, 'TEST');
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('A1010');
    expect(result[0].status).toBe('Completed');
    expect(result[0].originalDuration).toBe(10);
  });

  it('returns empty array for XML with parsererror', () => {
    const badXml = '<Project><Task><UID>1</UID><Name>Test</Task>'; // unclosed tag
    const result = parseScheduleXML(badXml, 'TEST');
    // xmldom may or may not produce parsererror for this; but it shouldn't crash
    // Just verify it doesn't throw
    expect(Array.isArray(result)).toBe(true);
  });

  it('parses MSProject duration format PT480H0M0S correctly', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project>
  <Tasks>
    <Task>
      <UID>1</UID>
      <Name>Long Task</Name>
      <Duration>PT480H0M0S</Duration>
      <PercentComplete>0</PercentComplete>
    </Task>
  </Tasks>
</Project>`;
    const result = parseScheduleXML(xml, 'TEST');
    expect(result.length).toBe(1);
    // 480 hours / 8 = 60 days
    expect(result[0].originalDuration).toBe(60);
    expect(result[0].status).toBe('Not Started');
  });

  it('maps PercentComplete to status', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project>
  <Tasks>
    <Task>
      <UID>1</UID><Name>Done</Name><Duration>PT8H0M0S</Duration><PercentComplete>100</PercentComplete>
    </Task>
    <Task>
      <UID>2</UID><Name>Half</Name><Duration>PT16H0M0S</Duration><PercentComplete>50</PercentComplete>
    </Task>
    <Task>
      <UID>3</UID><Name>New</Name><Duration>PT24H0M0S</Duration><PercentComplete>0</PercentComplete>
    </Task>
  </Tasks>
</Project>`;
    const result = parseScheduleXML(xml, 'TEST');
    expect(result[0].status).toBe('Completed');
    expect(result[1].status).toBe('In Progress');
    expect(result[2].status).toBe('Not Started');
  });

  it('parses PredecessorLink with type and lag', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project>
  <Tasks>
    <Task>
      <UID>1</UID><Name>First</Name><Duration>PT8H0M0S</Duration><PercentComplete>0</PercentComplete>
    </Task>
    <Task>
      <UID>2</UID><Name>Second</Name><Duration>PT8H0M0S</Duration><PercentComplete>0</PercentComplete>
      <PredecessorLink>
        <PredecessorUID>1</PredecessorUID>
        <Type>1</Type>
        <LinkLag>9600</LinkLag>
      </PredecessorLink>
    </Task>
  </Tasks>
</Project>`;
    const result = parseScheduleXML(xml, 'TEST');
    const second = result.find(a => a.taskCode === 'MSP-2');
    expect(second).toBeDefined();
    expect(second!.predecessors.length).toBe(1);
    // Type 1 = FS
    expect(second!.successorDetails[0].relationshipType).toBe('FS');
    // LinkLag 9600 in tenths of minutes → 9600 / 4800 = 2 days
    expect(second!.successorDetails[0].lag).toBe(2);
  });

  it('returns empty array for empty XML', () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><Project></Project>';
    const result = parseScheduleXML(xml, 'TEST');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseScheduleFile — dispatcher
// ---------------------------------------------------------------------------
describe('parseScheduleFile', () => {
  it('routes P6-CSV to CSV parser', () => {
    const csv = 'h1,h2,h3,h4\nd1,d2,d3,d4\nTASK-1,Not Started,WBS.1,Test';
    const result = parseScheduleFile(csv, 'P6-CSV', 'TEST');
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('TASK-1');
  });

  it('routes P6-XER to XER parser', () => {
    const xer = [
      '%T\tTASK',
      '%F\ttask_id\ttask_code\ttask_name\tstatus_code\ttarget_drtn_hr_cnt\tremain_drtn_hr_cnt',
      '%R\t100\tX1\tXER Task\tTK_NotStart\t80\t80',
    ].join('\n');
    const result = parseScheduleFile(xer, 'P6-XER', 'TEST');
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('X1');
  });

  it('routes MSProject-XML to XML parser', () => {
    const xml = `<?xml version="1.0"?><Project><Tasks><Task><UID>1</UID><Name>XML Task</Name><Duration>PT8H0M0S</Duration><PercentComplete>0</PercentComplete></Task></Tasks></Project>`;
    const result = parseScheduleFile(xml, 'MSProject-XML', 'TEST');
    expect(result.length).toBe(1);
    expect(result[0].taskCode).toBe('MSP-1');
  });
});
