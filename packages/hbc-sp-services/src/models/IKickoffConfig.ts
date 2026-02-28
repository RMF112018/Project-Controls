import { EstimatingKickoffSection } from './IEstimatingKickoff';

/**
 * Editor component types available for kickoff section columns.
 * Stage 8: maps each Excel column to an inline-editable cell variant.
 */
export type KickoffColumnEditorType =
  | 'text'
  | 'date'
  | 'datetime'
  | 'select'
  | 'checkbox'
  | 'yes-no-na'
  | 'number'
  | 'people'
  | 'readonly'
  | 'status-select'
  | 'phone'
  | 'email'
  | 'textarea';

/**
 * Configuration for a single column within a kickoff section table.
 * Maps 1:1 to an Excel column header.
 */
export interface IKickoffColumnConfig {
  /** Key mapping to the IEstimatingKickoffItem field (or parent field for project_info/key_dates) */
  key: string;
  /** Display header label (matches Excel column header) */
  header: string;
  /** Editor component type */
  editorType: KickoffColumnEditorType;
  /** CSS width hint (e.g. '120px' or '1fr') */
  width?: string;
  /** Minimum width */
  minWidth?: string;
  /** Whether this column is editable (default: true) */
  editable?: boolean;
  /** Whether this column is required for validation */
  required?: boolean;
  /** For 'select' editor: available option values */
  options?: string[];
  /** Tooltip / help text */
  tooltip?: string;
  /** Hide on mobile breakpoints */
  hideOnMobile?: boolean;
  /** For 'status-select': key of the column this depends on (e.g. 'status') */
  dependsOnColumn?: string;
  /** For 'status-select': value of dependency column that enables this cell */
  enabledWhenValue?: string;
}

/**
 * Configuration for an entire kickoff section (maps 1:1 to an Excel section).
 * This is the single source of truth — both EstimatingKickoffPage and
 * DepartmentTrackingPage consume these configs identically.
 */
export interface IKickoffSectionConfig {
  /** Section key matching EstimatingKickoffSection */
  sectionKey: EstimatingKickoffSection;
  /** Display title (matches Excel section header) */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Column definitions for this section's table */
  columns: IKickoffColumnConfig[];
  /** Whether users can add custom rows (default: false) */
  allowCustomRows?: boolean;
  /** Maximum number of custom rows allowed (default: unlimited) */
  maxCustomRows?: number;
  /** Whether users can remove rows — only custom rows by default (default: false) */
  allowRowRemoval?: boolean;
  /** Whether section starts expanded (default: true) */
  defaultExpanded?: boolean;
  /** Hide the table header row (for label|value layouts like Project Information) */
  hideHeader?: boolean;
  /** Per-item editor type overrides keyed by parentField value.
   *  Used by project_info section for per-row editor types. */
  editorTypeOverrides?: Record<string, {
    editorType: KickoffColumnEditorType;
    options?: string[];
    placeholder?: string;
  }>;
}
