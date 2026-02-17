import { IScheduleActivity, IScheduleRelationship, ActivityStatus, RelationshipType, ScheduleImportFormat } from '../models/IScheduleActivity';

/**
 * Parse a CSV line respecting quoted fields that contain commas.
 * Returns array of field values.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse P6 date format "M/D/YYYY HH:MM" → ISO 8601 string, or null.
 */
function parseP6Date(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, month, day, year, hour, minute] = match;
  const m = month.padStart(2, '0');
  const d = day.padStart(2, '0');
  return `${year}-${m}-${d}T${hour}:${minute}:00.000Z`;
}

/**
 * Parse comma-separated predecessor/successor list.
 * Input: "PRECON-30, SM-NTP" → ["PRECON-30", "SM-NTP"]
 */
function parsePredSuccList(raw: string): string[] {
  if (!raw || raw.trim() === '') return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse successor details string into IScheduleRelationship[].
 * Input: "SITEWORK-40: FS , SITEWORK-20: SS 5"
 * Output: [{ taskCode: "SITEWORK-40", relationshipType: "FS", lag: 0 },
 *          { taskCode: "SITEWORK-20", relationshipType: "SS", lag: 5 }]
 */
function parseSuccessorDetails(raw: string): IScheduleRelationship[] {
  if (!raw || raw.trim() === '') return [];
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(part => {
    // Format: "TASKCODE: TYPE [LAG]"
    const colonIdx = part.lastIndexOf(':');
    if (colonIdx === -1) {
      return { taskCode: part.trim(), relationshipType: 'FS' as RelationshipType, lag: 0 };
    }
    const taskCode = part.substring(0, colonIdx).trim();
    const rest = part.substring(colonIdx + 1).trim();
    const tokens = rest.split(/\s+/);
    const relType = (tokens[0] || 'FS') as RelationshipType;
    const lag = tokens.length > 1 ? parseInt(tokens[1], 10) || 0 : 0;
    return { taskCode, relationshipType: relType, lag };
  });
}

/**
 * Compute variance in days between two ISO date strings.
 * Returns (actual - baseline) in calendar days.
 */
function computeVarianceDays(baselineDate: string | null, actualDate: string | null): number | null {
  if (!baselineDate || !actualDate) return null;
  const baseline = new Date(baselineDate).getTime();
  const actual = new Date(actualDate).getTime();
  return Math.round((actual - baseline) / (1000 * 60 * 60 * 24));
}

/**
 * Parse a P6-format CSV export into IScheduleActivity[].
 *
 * Expected CSV structure:
 * - Row 0: internal column names (task_code, status_code, ...)
 * - Row 1: display names (Activity ID, Activity Status, ...)
 * - Row 2+: data rows
 *
 * Column indices (0-based):
 *  0: task_code, 1: status_code, 2: wbs_id, 3: task_name,
 *  4: original_duration, 5: remaining_duration, 6: actual_duration,
 *  7: baseline_start, 8: planned_start, 9: actual_start,
 * 10: baseline_finish, 11: planned_finish, 12: actual_finish,
 * 13: remaining_float, 14: free_float, 15: activity_type,
 * 16: predecessors, 17: successors, 18: successor_details,
 * 19: resources, 20: primary_constraint, 21: secondary_constraint,
 * 22: calendar_name, 23: delete_flag
 */
export function parseScheduleCSV(csvText: string, projectCode: string): IScheduleActivity[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 3) return []; // need at least header rows + 1 data row

  const activities: IScheduleActivity[] = [];
  const now = new Date().toISOString();

  for (let i = 2; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 4 || !fields[0]) continue; // skip empty rows

      const taskCode = fields[0];
      const statusRaw = fields[1] || 'Not Started';
      const status: ActivityStatus =
        statusRaw === 'Completed' ? 'Completed' :
        statusRaw === 'In Progress' ? 'In Progress' : 'Not Started';

      const originalDuration = parseFloat(fields[4]) || 0;
      const remainingDuration = parseFloat(fields[5]) || 0;
      const actualDuration = parseFloat(fields[6]) || 0;

      const baselineStartDate = parseP6Date(fields[7]);
      const plannedStartDate = parseP6Date(fields[8]);
      const actualStartDate = parseP6Date(fields[9]);
      const baselineFinishDate = parseP6Date(fields[10]);
      const plannedFinishDate = parseP6Date(fields[11]);
      const actualFinishDate = parseP6Date(fields[12]);

      const remainingFloat = fields[13] !== undefined && fields[13] !== '' ? parseFloat(fields[13]) : null;
      const freeFloat = fields[14] !== undefined && fields[14] !== '' ? parseFloat(fields[14]) : null;

      const predecessors = parsePredSuccList(fields[16] || '');
      const successors = parsePredSuccList(fields[17] || '');
      const successorDetails = parseSuccessorDetails(fields[18] || '');

      const isCritical = remainingFloat !== null ? remainingFloat <= 0 : false;
      const percentComplete =
        status === 'Completed' ? 100 :
        status === 'In Progress' && (actualDuration + remainingDuration) > 0
          ? Math.round((actualDuration / (actualDuration + remainingDuration)) * 100)
          : 0;

      const startVarianceDays = computeVarianceDays(baselineStartDate, actualStartDate || plannedStartDate);
      const finishVarianceDays = computeVarianceDays(baselineFinishDate, actualFinishDate || plannedFinishDate);

      activities.push({
        id: i - 1, // 1-based IDs
        projectCode,
        taskCode,
        wbsCode: fields[2] || '',
        activityName: fields[3] || '',
        activityType: fields[15] || 'Task Dependent',
        status,
        originalDuration,
        remainingDuration,
        actualDuration,
        baselineStartDate,
        baselineFinishDate,
        plannedStartDate,
        plannedFinishDate,
        actualStartDate,
        actualFinishDate,
        remainingFloat,
        freeFloat,
        predecessors,
        successors,
        successorDetails,
        resources: fields[19] || '',
        calendarName: fields[22] || '',
        primaryConstraint: fields[20] || '',
        secondaryConstraint: fields[21] || '',
        isCritical,
        percentComplete,
        startVarianceDays,
        finishVarianceDays,
        deleteFlag: (fields[23] || '').toLowerCase() === 'y',
        createdDate: now,
        modifiedDate: now,
      });
    } catch (err) {
      console.warn(`parseScheduleCSV: skipping row ${i + 1} due to error:`, err);
      continue;
    }
  }

  return activities;
}

// ---------------------------------------------------------------------------
// XER Parser — Primavera P6 XER format (tab-delimited text)
// ---------------------------------------------------------------------------

/**
 * Map P6 XER status codes to ActivityStatus.
 */
function mapXERStatus(code: string): ActivityStatus {
  switch (code) {
    case 'TK_Complete': return 'Completed';
    case 'TK_Active': return 'In Progress';
    case 'TK_NotStart':
    default: return 'Not Started';
  }
}

/**
 * Parse an ISO-ish date from XER (YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM:SS) → ISO string or null.
 */
function parseXERDate(dateStr: string | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const trimmed = dateStr.trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed;
  // YYYY-MM-DD HH:MM
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
  if (match) return `${match[1]}T${match[2]}:00.000Z`;
  // YYYY-MM-DD only
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00.000Z`;
  return null;
}

/**
 * Parse a P6 XER file into IScheduleActivity[].
 *
 * XER format is text-based, tab-delimited:
 * - %T TABLE_NAME — declares current table
 * - %F field1 field2 ... — field names for the current table
 * - %R val1\tval2\t... — data row (tab-separated)
 */
export function parseScheduleXER(xerText: string, projectCode: string): IScheduleActivity[] {
  const lines = xerText.split(/\r?\n/);
  let currentTable = '';
  let fieldNames: string[] = [];

  // Parsed TASK rows
  interface XERTask { [key: string]: string }
  const tasks: XERTask[] = [];

  // Predecessor map: task_id → { pred_task_id, pred_type, lag_hr_cnt }[]
  interface XERPred { predTaskId: string; predType: string; lagHours: number }
  const predMap = new Map<string, XERPred[]>();

  for (const line of lines) {
    if (line.startsWith('%T')) {
      currentTable = line.substring(2).trim().split(/\s+/)[0] || '';
      fieldNames = [];
    } else if (line.startsWith('%F')) {
      fieldNames = line.substring(2).trim().split('\t');
    } else if (line.startsWith('%R') && fieldNames.length > 0) {
      const values = line.substring(2).trim().split('\t');
      const row: Record<string, string> = {};
      for (let i = 0; i < fieldNames.length && i < values.length; i++) {
        row[fieldNames[i]] = values[i] || '';
      }

      if (currentTable === 'TASK') {
        tasks.push(row);
      } else if (currentTable === 'TASKPRED') {
        const taskId = row['task_id'] || '';
        const predTaskId = row['pred_task_id'] || '';
        const predType = row['pred_type'] || 'PR_FS';
        const lagHours = parseFloat(row['lag_hr_cnt'] || '0') || 0;
        if (taskId) {
          if (!predMap.has(taskId)) predMap.set(taskId, []);
          predMap.get(taskId)!.push({ predTaskId, predType, lagHours });
        }
      }
    }
  }

  // Build task_id → task_code lookup
  const idToCode = new Map<string, string>();
  for (const t of tasks) {
    if (t['task_id'] && t['task_code']) {
      idToCode.set(t['task_id'], t['task_code']);
    }
  }

  const now = new Date().toISOString();
  const activities: IScheduleActivity[] = [];

  for (let idx = 0; idx < tasks.length; idx++) {
    try {
      const t = tasks[idx];
      const taskId = t['task_id'] || '';
      const taskCode = t['task_code'] || `TASK-${idx + 1}`;
      const status = mapXERStatus(t['status_code'] || '');

      const originalDuration = (parseFloat(t['target_drtn_hr_cnt'] || '0') || 0) / 8;
      const remainingDuration = (parseFloat(t['remain_drtn_hr_cnt'] || '0') || 0) / 8;
      const actualDuration = Math.max(0, originalDuration - remainingDuration);

      const baselineStartDate = parseXERDate(t['target_start_date']);
      const baselineFinishDate = parseXERDate(t['target_end_date']);
      const plannedStartDate = parseXERDate(t['early_start_date'] || t['target_start_date']);
      const plannedFinishDate = parseXERDate(t['early_end_date'] || t['target_end_date']);
      const actualStartDate = parseXERDate(t['act_start_date']);
      const actualFinishDate = parseXERDate(t['act_end_date']);

      const totalFloatHrs = parseFloat(t['total_float_hr_cnt'] || '');
      const remainingFloat = isNaN(totalFloatHrs) ? null : Math.round(totalFloatHrs / 8);
      const freeFloatHrs = parseFloat(t['free_float_hr_cnt'] || '');
      const freeFloat = isNaN(freeFloatHrs) ? null : Math.round(freeFloatHrs / 8);

      // Build predecessor/successor info
      const preds = predMap.get(taskId) || [];
      const predecessors = preds.map(p => idToCode.get(p.predTaskId) || p.predTaskId);

      // Build successors by scanning all preds for entries pointing to this task
      const successorCodes: string[] = [];
      const successorDetails: IScheduleRelationship[] = [];
      for (const [succTaskId, succPreds] of predMap) {
        for (const sp of succPreds) {
          if (sp.predTaskId === taskId) {
            const succCode = idToCode.get(succTaskId) || succTaskId;
            successorCodes.push(succCode);
            const relTypeMap: Record<string, RelationshipType> = {
              'PR_FS': 'FS', 'PR_FF': 'FF', 'PR_SS': 'SS', 'PR_SF': 'SF',
            };
            successorDetails.push({
              taskCode: succCode,
              relationshipType: relTypeMap[sp.predType] || 'FS',
              lag: Math.round(sp.lagHours / 8),
            });
          }
        }
      }

      const isCritical = remainingFloat !== null ? remainingFloat <= 0 : false;
      const percentComplete =
        status === 'Completed' ? 100 :
        status === 'In Progress' && (actualDuration + remainingDuration) > 0
          ? Math.round((actualDuration / (actualDuration + remainingDuration)) * 100)
          : 0;

      const startVarianceDays = computeVarianceDays(baselineStartDate, actualStartDate || plannedStartDate);
      const finishVarianceDays = computeVarianceDays(baselineFinishDate, actualFinishDate || plannedFinishDate);

      activities.push({
        id: idx + 1,
        projectCode,
        taskCode,
        wbsCode: t['wbs_id'] || '',
        activityName: t['task_name'] || '',
        activityType: t['task_type'] || 'Task Dependent',
        status,
        originalDuration,
        remainingDuration,
        actualDuration,
        baselineStartDate,
        baselineFinishDate,
        plannedStartDate,
        plannedFinishDate,
        actualStartDate,
        actualFinishDate,
        remainingFloat,
        freeFloat,
        predecessors,
        successors: successorCodes,
        successorDetails,
        resources: t['rsrc_name'] || '',
        calendarName: t['clndr_name'] || '',
        primaryConstraint: t['cstr_type'] || '',
        secondaryConstraint: t['cstr_type2'] || '',
        isCritical,
        percentComplete,
        startVarianceDays,
        finishVarianceDays,
        deleteFlag: (t['delete_flag'] || '').toLowerCase() === 'y',
        createdDate: now,
        modifiedDate: now,
      });
    } catch (err) {
      console.warn(`parseScheduleXER: skipping task at index ${idx} due to error:`, err);
      continue;
    }
  }

  if (activities.length === 0 && tasks.length > 0) {
    console.warn(`parseScheduleXER: parsed 0 activities from ${tasks.length} TASK rows — check XER format`);
  }

  return activities;
}

// ---------------------------------------------------------------------------
// XML Parser — MSProject XML + P6 PMXML
// ---------------------------------------------------------------------------

/**
 * Parse an XML date string to ISO or null.
 * Handles: "2025-03-15T08:00:00", "2025-03-15"
 */
function parseXMLDate(el: Element | null, tagName: string): string | null {
  const node = el?.querySelector(tagName);
  if (!node?.textContent) return null;
  const val = node.textContent.trim();
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.endsWith('Z') ? val : `${val}Z`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val}T00:00:00.000Z`;
  return null;
}

function getElText(el: Element, tagName: string): string {
  return el.querySelector(tagName)?.textContent?.trim() || '';
}

function getElNum(el: Element, tagName: string): number {
  return parseFloat(getElText(el, tagName)) || 0;
}

/**
 * Parse an MSProject XML or P6 PMXML file into IScheduleActivity[].
 * Auto-detects format by root element.
 */
export function parseScheduleXML(xmlText: string, projectCode: string): IScheduleActivity[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.warn('parseScheduleXML: XML parse error:', parseError.textContent);
    return [];
  }

  const rootTag = doc.documentElement.tagName;

  if (rootTag === 'APIBusinessObjects' || rootTag === 'ProjectData') {
    return parseP6PMXML(doc, projectCode);
  }
  // Default: MSProject XML
  return parseMSProjectXML(doc, projectCode);
}

function parseMSProjectXML(doc: Document, projectCode: string): IScheduleActivity[] {
  const tasks = doc.querySelectorAll('Task');
  const now = new Date().toISOString();
  const activities: IScheduleActivity[] = [];

  // Build UID → Name map for predecessor references
  const uidToName = new Map<string, string>();
  tasks.forEach(task => {
    const uid = getElText(task, 'UID');
    const name = getElText(task, 'Name');
    if (uid) uidToName.set(uid, name || uid);
  });

  let idCounter = 1;
  tasks.forEach(task => {
    try {
      const uid = getElText(task, 'UID');
      const name = getElText(task, 'Name');
      if (!uid || uid === '0' || !name) return; // skip summary/root

      // MSProject Duration format: "PT480H0M0S" → hours
      const durationStr = getElText(task, 'Duration');
      const durationHrs = parseMSProjectDuration(durationStr);
      const originalDuration = Math.round(durationHrs / 8);

      const percentComplete = getElNum(task, 'PercentComplete');
      const status: ActivityStatus =
        percentComplete >= 100 ? 'Completed' :
        percentComplete > 0 ? 'In Progress' : 'Not Started';

      const remainingDuration = status === 'Completed' ? 0 : Math.round(originalDuration * (1 - percentComplete / 100));
      const actualDuration = originalDuration - remainingDuration;

      const plannedStartDate = parseXMLDate(task, 'Start');
      const plannedFinishDate = parseXMLDate(task, 'Finish');
      const baselineStartDate = parseXMLDate(task, 'BaselineStart') || parseXMLDate(task, 'Start');
      const baselineFinishDate = parseXMLDate(task, 'BaselineFinish') || parseXMLDate(task, 'Finish');
      const actualStartDate = parseXMLDate(task, 'ActualStart');
      const actualFinishDate = parseXMLDate(task, 'ActualFinish');

      const totalSlack = getElText(task, 'TotalSlack');
      const remainingFloat = totalSlack ? Math.round(parseMSProjectDuration(totalSlack) / 8) : null;
      const freeSlack = getElText(task, 'FreeSlack');
      const freeFloat = freeSlack ? Math.round(parseMSProjectDuration(freeSlack) / 8) : null;

      // Predecessors
      const predLinks = task.querySelectorAll('PredecessorLink');
      const predecessors: string[] = [];
      const successorDetails: IScheduleRelationship[] = [];
      predLinks.forEach(link => {
        const predUID = getElText(link, 'PredecessorUID');
        const predName = uidToName.get(predUID) || predUID;
        predecessors.push(predName);
        const typeCode = getElText(link, 'Type');
        const msRelTypes: Record<string, RelationshipType> = { '0': 'FF', '1': 'FS', '2': 'SF', '3': 'SS' };
        const relType = msRelTypes[typeCode] || 'FS';
        const lagDur = getElText(link, 'LinkLag');
        const lagDays = lagDur ? Math.round(parseInt(lagDur, 10) / 4800) : 0; // MSProject lag in tenths of minutes
        successorDetails.push({ taskCode: predName, relationshipType: relType, lag: lagDays });
      });

      const wbsCode = getElText(task, 'WBS') || getElText(task, 'OutlineNumber');
      const isCritical = getElText(task, 'Critical') === '1' || (remainingFloat !== null && remainingFloat <= 0);
      const constraintType = getElText(task, 'ConstraintType');
      const constraintMap: Record<string, string> = {
        '0': '', '1': 'Must Start On', '2': 'Must Finish On',
        '3': 'Start No Earlier Than', '4': 'Start No Later Than',
        '5': 'Finish No Earlier Than', '6': 'Finish No Later Than',
        '7': 'As Late As Possible',
      };

      const startVarianceDays = computeVarianceDays(baselineStartDate, actualStartDate || plannedStartDate);
      const finishVarianceDays = computeVarianceDays(baselineFinishDate, actualFinishDate || plannedFinishDate);

      activities.push({
        id: idCounter++,
        projectCode,
        taskCode: `MSP-${uid}`,
        wbsCode,
        activityName: name,
        activityType: getElText(task, 'Type') === '1' ? 'Resource Dependent' : 'Task Dependent',
        status,
        originalDuration,
        remainingDuration,
        actualDuration,
        baselineStartDate,
        baselineFinishDate,
        plannedStartDate,
        plannedFinishDate,
        actualStartDate,
        actualFinishDate,
        remainingFloat,
        freeFloat,
        predecessors,
        successors: [],
        successorDetails,
        resources: getElText(task, 'ResourceName'),
        calendarName: getElText(task, 'CalendarUID'),
        primaryConstraint: constraintMap[constraintType] || constraintType,
        secondaryConstraint: '',
        isCritical,
        percentComplete,
        startVarianceDays,
        finishVarianceDays,
        deleteFlag: false,
        createdDate: now,
        modifiedDate: now,
      });
    } catch (err) {
      console.warn('parseMSProjectXML: skipping task element due to error:', err);
    }
  });

  // Backfill successors
  const codeSet = new Set(activities.map(a => a.taskCode));
  for (const act of activities) {
    for (const pred of act.predecessors) {
      const predAct = activities.find(a => a.taskCode === pred || a.activityName === pred);
      if (predAct && !predAct.successors.includes(act.taskCode)) {
        predAct.successors.push(act.taskCode);
      }
    }
  }
  // Filter successors to valid codes
  for (const act of activities) {
    act.successors = act.successors.filter(s => codeSet.has(s));
  }

  return activities;
}

function parseMSProjectDuration(durStr: string): number {
  if (!durStr) return 0;
  // Format: PT480H0M0S → 480 hours
  const match = durStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (match) return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
  // Try simpler formats
  const hMatch = durStr.match(/PT(\d+)H/);
  if (hMatch) return parseInt(hMatch[1], 10);
  const dMatch = durStr.match(/P(\d+)D/);
  if (dMatch) return parseInt(dMatch[1], 10) * 8;
  return parseFloat(durStr) || 0;
}

function parseP6PMXML(doc: Document, projectCode: string): IScheduleActivity[] {
  const activityEls = doc.querySelectorAll('Activity');
  const now = new Date().toISOString();
  const activities: IScheduleActivity[] = [];
  let idCounter = 1;

  activityEls.forEach(el => {
    try {
      const actId = getElText(el, 'Id') || getElText(el, 'ObjectId');
      const name = getElText(el, 'Name');
      if (!actId || !name) return;

      const statusCode = getElText(el, 'Status');
      const status: ActivityStatus =
        statusCode === 'Completed' ? 'Completed' :
        statusCode === 'In Progress' ? 'In Progress' : 'Not Started';

      const plannedDuration = getElNum(el, 'PlannedDuration') || getElNum(el, 'AtCompletionDuration');
      const remainingDuration = getElNum(el, 'RemainingDuration');
      const actualDuration = getElNum(el, 'ActualDuration');
      const originalDuration = plannedDuration || (actualDuration + remainingDuration);

      const baselineStartDate = parseXMLDate(el, 'PlannedStartDate');
      const baselineFinishDate = parseXMLDate(el, 'PlannedFinishDate');
      const plannedStartDate = parseXMLDate(el, 'StartDate') || baselineStartDate;
      const plannedFinishDate = parseXMLDate(el, 'FinishDate') || baselineFinishDate;
      const actualStartDate = parseXMLDate(el, 'ActualStartDate');
      const actualFinishDate = parseXMLDate(el, 'ActualFinishDate');

      const floatVal = getElText(el, 'RemainingTotalFloat') || getElText(el, 'TotalFloat');
      const remainingFloat = floatVal ? parseFloat(floatVal) : null;
      const freeFloatVal = getElText(el, 'RemainingFreeFloat') || getElText(el, 'FreeFloat');
      const freeFloat = freeFloatVal ? parseFloat(freeFloatVal) : null;

      const isCritical = remainingFloat !== null ? remainingFloat <= 0 : false;
      const pctComplete = getElNum(el, 'DurationPercentComplete') || getElNum(el, 'PercentComplete');

      const startVarianceDays = computeVarianceDays(baselineStartDate, actualStartDate || plannedStartDate);
      const finishVarianceDays = computeVarianceDays(baselineFinishDate, actualFinishDate || plannedFinishDate);

      activities.push({
        id: idCounter++,
        projectCode,
        taskCode: actId,
        wbsCode: getElText(el, 'WBSObjectId') || getElText(el, 'WBSCode') || '',
        activityName: name,
        activityType: getElText(el, 'Type') || 'Task Dependent',
        status,
        originalDuration,
        remainingDuration,
        actualDuration,
        baselineStartDate,
        baselineFinishDate,
        plannedStartDate,
        plannedFinishDate,
        actualStartDate,
        actualFinishDate,
        remainingFloat,
        freeFloat,
        predecessors: [],
        successors: [],
        successorDetails: [],
        resources: getElText(el, 'ResourceName') || '',
        calendarName: getElText(el, 'CalendarName') || '',
        primaryConstraint: getElText(el, 'PrimaryConstraintType') || '',
        secondaryConstraint: getElText(el, 'SecondaryConstraintType') || '',
        isCritical,
        percentComplete: pctComplete,
        startVarianceDays,
        finishVarianceDays,
        deleteFlag: false,
        createdDate: now,
        modifiedDate: now,
      });
    } catch (err) {
      console.warn('parseP6PMXML: skipping activity element due to error:', err);
    }
  });

  // Parse Relationship elements for pred/succ
  const codeToActivity = new Map(activities.map(a => [a.taskCode, a]));
  const relEls = doc.querySelectorAll('Relationship');
  relEls.forEach(rel => {
    const predId = getElText(rel, 'PredecessorActivityId') || getElText(rel, 'PredecessorActivityObjectId');
    const succId = getElText(rel, 'SuccessorActivityId') || getElText(rel, 'SuccessorActivityObjectId');
    const relType = getElText(rel, 'Type') || 'Finish to Start';
    const lag = getElNum(rel, 'Lag');

    const typeMap: Record<string, RelationshipType> = {
      'Finish to Start': 'FS', 'Start to Start': 'SS',
      'Finish to Finish': 'FF', 'Start to Finish': 'SF',
    };
    const mappedType = typeMap[relType] || 'FS';

    const predAct = codeToActivity.get(predId);
    const succAct = codeToActivity.get(succId);
    if (predAct && succAct) {
      predAct.successors.push(succId);
      predAct.successorDetails.push({ taskCode: succId, relationshipType: mappedType, lag });
      succAct.predecessors.push(predId);
    }
  });

  return activities;
}

// ---------------------------------------------------------------------------
// Unified Dispatcher
// ---------------------------------------------------------------------------

/**
 * Parse a schedule file (CSV, XER, or XML) into IScheduleActivity[].
 * Routes to the correct parser based on format.
 */
export function parseScheduleFile(
  text: string,
  format: ScheduleImportFormat,
  projectCode: string,
): IScheduleActivity[] {
  switch (format) {
    case 'P6-CSV':
    case 'MSProject-CSV':
      return parseScheduleCSV(text, projectCode);
    case 'P6-XER':
      return parseScheduleXER(text, projectCode);
    case 'MSProject-XML':
      return parseScheduleXML(text, projectCode);
    default:
      return parseScheduleCSV(text, projectCode);
  }
}
