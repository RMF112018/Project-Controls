import { IScheduleActivity, IScheduleRelationship, ActivityStatus, RelationshipType } from '../models/IScheduleActivity';

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
  }

  return activities;
}
