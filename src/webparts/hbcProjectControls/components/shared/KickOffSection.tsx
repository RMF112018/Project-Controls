/**
 * Stage 8/11 — KickOffSection: Config-driven section renderer for Estimating Kickoff.
 *
 * Accepts an IKickoffSectionConfig (from the single-source-of-truth kickoffSectionConfigs)
 * and renders a table with inline-editable cells per column definition. Used by both
 * EstimatingKickoffPage and DepartmentTrackingPage (Project Details drawer).
 *
 * This component is a pure renderer — it has zero knowledge of which sections exist.
 * All section/column definitions come from the config.
 */
import * as React from 'react';
import { Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import type {
  IKickoffSectionConfig,
  IKickoffColumnConfig,
  IEstimatingKickoffItem,
  IEstimatingKickoff,
  EstimatingKickoffSection,
  EstimatingKickoffStatus,
  KickoffDeliverableStatus,
} from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { CollapsibleSection } from './CollapsibleSection';
import {
  EditableTextCell,
  EditableNumberCell,
  EditableDateCell,
  EditableDateTimeCell,
  EditableSelectCell,
  EditableCheckboxCell,
  EditableYesNoNaCell,
  EditableStatusSelectCell,
  EditablePhoneCell,
  EditableEmailCell,
  EditableTextareaCell,
} from './editableCells';

// ── Styles ─────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  tableCompact: {
    fontSize: tokens.fontSizeBase100,
  },
  headerRow: {
    backgroundColor: HBC_COLORS.navy,
    color: '#FFFFFF',
  },
  th: {
    ...shorthands.padding('8px', '10px'),
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.navy),
  },
  thCompact: {
    ...shorthands.padding('4px', '6px'),
    fontSize: tokens.fontSizeBase100,
  },
  tr: {
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    ':hover': {
      backgroundColor: HBC_COLORS.gray50,
    },
  },
  trAlt: {
    backgroundColor: '#FAFBFC',
  },
  td: {
    ...shorthands.padding('6px', '10px'),
    verticalAlign: 'middle',
  },
  tdCompact: {
    ...shorthands.padding('3px', '6px'),
  },
  editableCell: {
    cursor: 'pointer',
    display: 'block',
    minHeight: '20px',
    ...shorthands.padding('2px', '4px'),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  inlineInput: {
    width: '100%',
    minWidth: '60px',
  },
  readonlyCell: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  customRowLabel: {
    fontStyle: 'italic',
    color: HBC_COLORS.gray500,
  },
  addRowBtn: {
    ...shorthands.margin('8px', '0'),
  },
  deleteBtn: {
    minWidth: '24px',
    width: '24px',
    height: '24px',
    ...shorthands.padding('0'),
  },
  inlineCheckbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: HBC_COLORS.gray100,
    color: HBC_COLORS.gray600,
  },
  kvRow: {
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray100),
    ':hover': { backgroundColor: HBC_COLORS.gray50 },
  },
  kvLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase200,
  },
  kvValue: {
    textAlign: 'right' as const,
  },
  footer: {
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderTop('1px', 'solid', HBC_COLORS.gray200),
  },
});

// ── Props ──────────────────────────────────────────────────────────────
export interface IKickOffSectionProps {
  /** Section configuration from kickoffSectionConfigs (single source of truth) */
  config: IKickoffSectionConfig;
  /** Items for this section (pre-filtered from IEstimatingKickoff.items) */
  items: IEstimatingKickoffItem[];
  /** Parent kickoff data (for project_info/key_dates parentField mapping) */
  kickoff: IEstimatingKickoff;
  /** Callback when an item field is edited inline */
  onItemUpdate: (itemId: number, field: string, value: unknown) => void;
  /** Callback when a parent-level field is edited (project_info/key_dates) */
  onKickoffUpdate: (field: string, value: unknown) => void;
  /** Callback to add a custom row */
  onAddCustomRow?: (section: EstimatingKickoffSection) => void;
  /** Callback to remove a custom row */
  onRemoveRow?: (itemId: number) => void;
  /** Whether the user has edit permissions */
  canEdit: boolean;
  /** Override section expansion state */
  defaultExpanded?: boolean;
  /** Compact mode for embedding in drawers */
  compact?: boolean;
  /** Optional className for the outer wrapper */
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Resolve the display value for a cell, handling parentField mapping.
 *  Stage 11 Hotfix #2 – column-aware: only 'value' column reads from parent kickoff. */
function resolveValue(
  item: IEstimatingKickoffItem,
  column: IKickoffColumnConfig,
  kickoff: IEstimatingKickoff,
): unknown {
  // 'task' column always returns the item's row label
  if (column.key === 'task') {
    return item.task ?? '';
  }

  // Only the 'value' column (project_info) resolves from the parent kickoff record
  if (column.key === 'value' && item.parentField) {
    if (item.parentField.startsWith('keyPersonnel:')) {
      const role = item.parentField.split(':')[1];
      const entry = kickoff.keyPersonnel?.find(kp => kp.label === role);
      return entry?.person?.displayName ?? '';
    }
    return (kickoff as unknown as Record<string, unknown>)[item.parentField] ?? '';
  }

  // All other columns: standard item field access
  return (item as unknown as Record<string, unknown>)[column.key] ?? '';
}

/** Compute section completion count */
function getCompletionBadge(items: IEstimatingKickoffItem[], sectionKey: EstimatingKickoffSection): string {
  if (sectionKey === 'project_info' || sectionKey === 'key_dates') {
    // Count items with non-empty values as "complete"
    const filled = items.filter(i => {
      // We don't have direct access to resolved values here, so count items with deadline or notes
      return i.deadline || i.notes || i.responsibleParty;
    }).length;
    return `${filled}/${items.length}`;
  }
  // For managing/deliverables: count items where status is 'yes'
  const completed = items.filter(i => i.status === 'yes').length;
  return `${completed}/${items.length}`;
}

// ── Component ──────────────────────────────────────────────────────────
export const KickOffSection: React.FC<IKickOffSectionProps> = React.memo(({
  config,
  items,
  kickoff,
  onItemUpdate,
  onKickoffUpdate,
  onAddCustomRow,
  onRemoveRow,
  canEdit,
  defaultExpanded,
  compact = false,
  className,
}) => {
  const styles = useStyles();

  const sortedItems = React.useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  const badge = React.useMemo(
    () => <span className={styles.badge}>{getCompletionBadge(sortedItems, config.sectionKey)}</span>,
    [sortedItems, config.sectionKey, styles.badge],
  );

  const handleCellSave = React.useCallback(
    (itemId: number, field: string, value: unknown) => {
      const item = sortedItems.find(i => i.id === itemId);
      // Stage 11 Hotfix #2 – only 'value' column edits write to parent kickoff
      if (item?.parentField && field === 'value') {
        const pf = item.parentField;
        if (pf.startsWith('keyPersonnel:')) {
          // keyPersonnel updates handled differently — pass as-is for now
          onKickoffUpdate(pf, value);
        } else {
          onKickoffUpdate(pf, value);
        }
      } else {
        onItemUpdate(itemId, field, value);

        // Auto-set deliverableStatus when Required (status) changes
        if (field === 'status' && value === 'yes' && !item?.deliverableStatus) {
          onItemUpdate(itemId, 'deliverableStatus', 'Pending');
        }
        if (field === 'status' && (value === 'no' || value === 'na' || value === null)) {
          onItemUpdate(itemId, 'deliverableStatus', null);
        }
      }
    },
    [sortedItems, onItemUpdate, onKickoffUpdate],
  );

  const renderCell = React.useCallback(
    (item: IEstimatingKickoffItem, column: IKickoffColumnConfig, rowIdx: number) => {
      const rawValue = resolveValue(item, column, kickoff);
      const editable = canEdit && column.editable !== false && column.editorType !== 'readonly';

      // Resolve effective editor type (for editorTypeOverrides on project_info)
      let effectiveEditorType = column.editorType;
      let effectiveOptions = column.options;
      let effectivePlaceholder: string | undefined;
      if (column.key === 'value' && item.parentField && config.editorTypeOverrides) {
        const override = config.editorTypeOverrides[item.parentField];
        if (override) {
          effectiveEditorType = override.editorType;
          effectiveOptions = override.options ?? effectiveOptions;
          effectivePlaceholder = override.placeholder;
        }
      }

      const isEffectiveEditable = canEdit && column.editable !== false && effectiveEditorType !== 'readonly';

      switch (effectiveEditorType) {
        case 'readonly':
          return (
            <span className={mergeClasses(styles.readonlyCell, item.isCustom ? styles.customRowLabel : undefined)}>
              {String(rawValue || '')}
            </span>
          );

        case 'text':
          return isEffectiveEditable ? (
            <EditableTextCell
              rowId={item.id}
              field={column.key}
              value={String(rawValue ?? '')}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{String(rawValue ?? '') || '\u2014'}</span>
          );

        case 'number':
          return isEffectiveEditable ? (
            <EditableNumberCell
              rowId={item.id}
              field={column.key}
              numValue={rawValue as number | undefined | null}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{rawValue != null ? String(rawValue) : '\u2014'}</span>
          );

        case 'date':
          return isEffectiveEditable ? (
            <EditableDateCell
              rowId={item.id}
              field={column.key}
              isoValue={rawValue as string | undefined | null}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{rawValue ? String(rawValue).split('T')[0] : '\u2014'}</span>
          );

        case 'datetime':
          return isEffectiveEditable ? (
            <EditableDateTimeCell
              rowId={item.id}
              field={column.key}
              isoValue={rawValue as string | undefined | null}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{rawValue ? String(rawValue) : '\u2014'}</span>
          );

        case 'select':
          return isEffectiveEditable ? (
            <EditableSelectCell
              rowId={item.id}
              field={column.key}
              value={String(rawValue ?? '')}
              options={effectiveOptions ?? []}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{String(rawValue ?? '') || '\u2014'}</span>
          );

        case 'checkbox':
          return isEffectiveEditable ? (
            <EditableCheckboxCell
              rowId={item.id}
              field={column.key}
              checked={Boolean(rawValue)}
              onSave={handleCellSave}
              wrapperClassName={styles.inlineCheckbox}
            />
          ) : (
            <span>{rawValue ? 'Yes' : 'No'}</span>
          );

        case 'yes-no-na':
          return isEffectiveEditable ? (
            <EditableYesNoNaCell
              rowId={item.id}
              field={column.key}
              value={rawValue as EstimatingKickoffStatus}
              onSave={handleCellSave}
            />
          ) : (
            <span>{rawValue ? String(rawValue).toUpperCase() : '\u2014'}</span>
          );

        case 'status-select': {
          const depColumn = column.dependsOnColumn;
          const enabledVal = column.enabledWhenValue;
          const itemRec = item as unknown as Record<string, unknown>;
          const disabled = depColumn ? String(itemRec[depColumn] ?? '') !== enabledVal : false;
          return isEffectiveEditable ? (
            <EditableStatusSelectCell
              rowId={item.id}
              field={column.key}
              value={rawValue as KickoffDeliverableStatus}
              options={effectiveOptions ?? []}
              disabled={disabled}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{rawValue ? String(rawValue) : '\u2014'}</span>
          );
        }

        case 'phone':
          return isEffectiveEditable ? (
            <EditablePhoneCell
              rowId={item.id}
              field={column.key}
              value={String(rawValue ?? '')}
              placeholder={effectivePlaceholder}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{String(rawValue ?? '') || '\u2014'}</span>
          );

        case 'email':
          return isEffectiveEditable ? (
            <EditableEmailCell
              rowId={item.id}
              field={column.key}
              value={String(rawValue ?? '')}
              placeholder={effectivePlaceholder}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{String(rawValue ?? '') || '\u2014'}</span>
          );

        case 'textarea':
          return isEffectiveEditable ? (
            <EditableTextareaCell
              rowId={item.id}
              field={column.key}
              value={String(rawValue ?? '')}
              onSave={handleCellSave}
              cellClassName={styles.editableCell}
              inputClassName={styles.inlineInput}
            />
          ) : (
            <span>{String(rawValue ?? '') || '\u2014'}</span>
          );

        default:
          return <span>{String(rawValue ?? '')}</span>;
      }
    },
    [kickoff, canEdit, handleCellSave, config.editorTypeOverrides, styles],
  );

  const showAddRow = config.allowCustomRows && canEdit && onAddCustomRow;
  const showDelete = config.allowRowRemoval && canEdit && onRemoveRow;

  return (
    <div className={className}>
      <CollapsibleSection
        title={config.title}
        subtitle={config.subtitle}
        defaultExpanded={defaultExpanded ?? config.defaultExpanded ?? true}
        badge={badge}
      >
        <table className={mergeClasses(styles.table, compact ? styles.tableCompact : undefined)}>
          {!config.hideHeader && (
            <thead>
              <tr className={styles.headerRow}>
                {config.columns.map(col => (
                  <th
                    key={col.key}
                    className={mergeClasses(styles.th, compact ? styles.thCompact : undefined)}
                    style={{ width: col.width, minWidth: col.minWidth }}
                  >
                    {col.header}
                  </th>
                ))}
                {showDelete && (
                  <th className={mergeClasses(styles.th, compact ? styles.thCompact : undefined)} style={{ width: '40px' }} />
                )}
              </tr>
            </thead>
          )}
          <tbody>
            {sortedItems.map((item, idx) => (
              <tr
                key={item.id}
                className={mergeClasses(
                  config.hideHeader ? styles.kvRow : styles.tr,
                  idx % 2 === 1 ? styles.trAlt : undefined,
                )}
              >
                {config.columns.map(col => (
                  <td
                    key={col.key}
                    className={mergeClasses(
                      styles.td,
                      compact ? styles.tdCompact : undefined,
                      config.hideHeader && col.key === 'task' ? styles.kvLabel : undefined,
                      config.hideHeader && col.key === 'value' ? styles.kvValue : undefined,
                    )}
                  >
                    {renderCell(item, col, idx)}
                  </td>
                ))}
                {showDelete && (
                  <td className={mergeClasses(styles.td, compact ? styles.tdCompact : undefined)}>
                    {item.isCustom && (
                      <Button
                        className={styles.deleteBtn}
                        appearance="subtle"
                        size="small"
                        icon={<Delete24Regular />}
                        aria-label={`Remove ${item.task}`}
                        onClick={() => onRemoveRow!(item.id)}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {showAddRow && (
          <div className={styles.footer}>
            <Button
              className={styles.addRowBtn}
              appearance="subtle"
              size="small"
              icon={<Add24Regular />}
              onClick={() => onAddCustomRow!(config.sectionKey)}
            >
              Add custom row
            </Button>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
});
KickOffSection.displayName = 'KickOffSection';
