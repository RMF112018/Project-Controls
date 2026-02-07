/**
 * Historical Data Migration Script
 * Converts CSV estimating history data to JSON compatible with mock/estimating.json
 *
 * Usage:
 *   npx ts-node scripts/migrate-estimating-history.ts input.csv output.json
 *
 * CSV Column Mapping:
 *   Title              → Title (required)
 *   ProjectCode        → ProjectCode (required)
 *   LeadEstimator      → LeadEstimator (required)
 *   LeadID             → LeadID
 *   Source             → Source (ITB | Negotiated | CMAR | DesignBuild)
 *   DeliverableType    → DeliverableType
 *   SubBidsDue         → SubBidsDue (ISO date string)
 *   PreSubmissionReview → PreSubmissionReview (ISO date string)
 *   WinStrategyMeeting → WinStrategyMeeting (ISO date string)
 *   DueDate_OutTheDoor → DueDate_OutTheDoor (ISO date string)
 *   LeadEstimatorId    → LeadEstimatorId
 *   Contributors       → Contributors (semicolon-separated)
 *   PX_ProjectExecutive → PX_ProjectExecutive
 *   Chk_BidBond        → Chk_BidBond (true/false/yes/no/1/0)
 *   Chk_PPBond         → Chk_PPBond
 *   Chk_Schedule       → Chk_Schedule
 *   Chk_Logistics      → Chk_Logistics
 *   Chk_BIMProposal    → Chk_BIMProposal
 *   Chk_PreconProposal → Chk_PreconProposal
 *   Chk_ProposalTabs   → Chk_ProposalTabs
 *   Chk_CoordMarketing → Chk_CoordMarketing
 *   Chk_BusinessTerms  → Chk_BusinessTerms
 *   DocSetStage        → DocSetStage
 *   PreconFee          → PreconFee (number)
 *   FeePaidToDate      → FeePaidToDate (number)
 *   DesignBudget       → DesignBudget (number)
 *   EstimateType       → EstimateType
 *   EstimatedCostValue → EstimatedCostValue (number)
 *   CostPerGSF         → CostPerGSF (number)
 *   CostPerUnit        → CostPerUnit (number)
 *   SubmittedDate      → SubmittedDate (ISO date string)
 *   AwardStatus        → AwardStatus (Pending | Awarded | Lost | Cancelled)
 *   NotesFeedback      → NotesFeedback
 */

import * as fs from 'fs';
import * as path from 'path';

interface IEstimatingRecord {
  id: number;
  Title: string;
  LeadID: number;
  ProjectCode: string;
  Source?: string;
  DeliverableType?: string;
  SubBidsDue?: string;
  PreSubmissionReview?: string;
  WinStrategyMeeting?: string;
  DueDate_OutTheDoor?: string;
  LeadEstimator?: string;
  LeadEstimatorId?: number;
  Contributors?: string[];
  PX_ProjectExecutive?: string;
  Chk_BidBond?: boolean;
  Chk_PPBond?: boolean;
  Chk_Schedule?: boolean;
  Chk_Logistics?: boolean;
  Chk_BIMProposal?: boolean;
  Chk_PreconProposal?: boolean;
  Chk_ProposalTabs?: boolean;
  Chk_CoordMarketing?: boolean;
  Chk_BusinessTerms?: boolean;
  DocSetStage?: string;
  PreconFee?: number;
  FeePaidToDate?: number;
  DesignBudget?: number;
  EstimateType?: string;
  EstimatedCostValue?: number;
  CostPerGSF?: number;
  CostPerUnit?: number;
  SubmittedDate?: string;
  AwardStatus?: string;
  NotesFeedback?: string;
}

const REQUIRED_FIELDS = ['Title', 'ProjectCode', 'LeadEstimator'];

const BOOLEAN_FIELDS = [
  'Chk_BidBond', 'Chk_PPBond', 'Chk_Schedule', 'Chk_Logistics',
  'Chk_BIMProposal', 'Chk_PreconProposal', 'Chk_ProposalTabs',
  'Chk_CoordMarketing', 'Chk_BusinessTerms',
];

const NUMBER_FIELDS = [
  'LeadID', 'LeadEstimatorId', 'PreconFee', 'FeePaidToDate',
  'DesignBudget', 'EstimatedCostValue', 'CostPerGSF', 'CostPerUnit',
];

const DATE_FIELDS = [
  'SubBidsDue', 'PreSubmissionReview', 'WinStrategyMeeting',
  'DueDate_OutTheDoor', 'SubmittedDate',
];

const OPTIONAL_FIELDS = [
  'LeadID', 'Source', 'DeliverableType', ...DATE_FIELDS,
  'LeadEstimatorId', 'Contributors', 'PX_ProjectExecutive',
  ...BOOLEAN_FIELDS, 'DocSetStage', ...NUMBER_FIELDS.filter(f => f !== 'LeadID' && f !== 'LeadEstimatorId'),
  'EstimateType', 'AwardStatus', 'NotesFeedback',
];

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function parseBoolean(val: string): boolean | undefined {
  if (!val) return undefined;
  const lower = val.toLowerCase();
  if (['true', 'yes', '1'].includes(lower)) return true;
  if (['false', 'no', '0'].includes(lower)) return false;
  return undefined;
}

function parseNumber(val: string): number | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[$,]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}

function convertRow(row: Record<string, string>, index: number): IEstimatingRecord | null {
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) {
      console.warn(`  Row ${index + 1}: Missing required field "${field}" — skipping row`);
      return null;
    }
  }

  // Check for missing optional fields
  for (const field of OPTIONAL_FIELDS) {
    if (!(field in row) || !row[field]) {
      warnings.push(field);
    }
  }
  if (warnings.length > 0) {
    console.warn(`  Row ${index + 1}: Missing optional fields: ${warnings.join(', ')}`);
  }

  const record: IEstimatingRecord = {
    id: index + 1,
    Title: row['Title'],
    LeadID: parseNumber(row['LeadID']) || 0,
    ProjectCode: row['ProjectCode'],
    LeadEstimator: row['LeadEstimator'],
  };

  // String fields
  if (row['Source']) record.Source = row['Source'];
  if (row['DeliverableType']) record.DeliverableType = row['DeliverableType'];
  if (row['PX_ProjectExecutive']) record.PX_ProjectExecutive = row['PX_ProjectExecutive'];
  if (row['DocSetStage']) record.DocSetStage = row['DocSetStage'];
  if (row['EstimateType']) record.EstimateType = row['EstimateType'];
  if (row['AwardStatus']) record.AwardStatus = row['AwardStatus'];
  if (row['NotesFeedback']) record.NotesFeedback = row['NotesFeedback'];

  // Date fields
  for (const field of DATE_FIELDS) {
    if (row[field]) {
      (record as Record<string, unknown>)[field] = row[field];
    }
  }

  // Number fields
  const leadEstimatorId = parseNumber(row['LeadEstimatorId']);
  if (leadEstimatorId !== undefined) record.LeadEstimatorId = leadEstimatorId;

  const preconFee = parseNumber(row['PreconFee']);
  if (preconFee !== undefined) record.PreconFee = preconFee;

  const feePaidToDate = parseNumber(row['FeePaidToDate']);
  if (feePaidToDate !== undefined) record.FeePaidToDate = feePaidToDate;

  const designBudget = parseNumber(row['DesignBudget']);
  if (designBudget !== undefined) record.DesignBudget = designBudget;

  const estimatedCostValue = parseNumber(row['EstimatedCostValue']);
  if (estimatedCostValue !== undefined) record.EstimatedCostValue = estimatedCostValue;

  const costPerGSF = parseNumber(row['CostPerGSF']);
  if (costPerGSF !== undefined) record.CostPerGSF = costPerGSF;

  const costPerUnit = parseNumber(row['CostPerUnit']);
  if (costPerUnit !== undefined) record.CostPerUnit = costPerUnit;

  // Boolean fields
  for (const field of BOOLEAN_FIELDS) {
    const val = parseBoolean(row[field]);
    if (val !== undefined) {
      (record as Record<string, unknown>)[field] = val;
    }
  }

  // Contributors (semicolon-separated)
  if (row['Contributors']) {
    record.Contributors = row['Contributors'].split(';').map(c => c.trim()).filter(Boolean);
  }

  return record;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx ts-node scripts/migrate-estimating-history.ts <input.csv> <output.json>');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${inputPath}`);
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const records: IEstimatingRecord[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const record = convertRow(rows[i], i);
    if (record) {
      records.push(record);
    } else {
      skipped++;
    }
  }

  console.log(`\nConversion complete:`);
  console.log(`  Converted: ${records.length} records`);
  console.log(`  Skipped: ${skipped} rows (missing required fields)`);

  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
  console.log(`Output written to: ${outputPath}`);
}

main();
