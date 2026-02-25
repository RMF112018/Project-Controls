import * as React from 'react';
import {
  Checkbox,
  Input,
  Select,
  TabList,
  Tab,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { HbcField } from '../../shared/HbcField';
import { SlideDrawer } from '../../shared/SlideDrawer';
import { RoleGate } from '../../guards/RoleGate';
import { useAppContext } from '../../contexts/AppContext';
import {
  AwardStatus,
  EstimateSource,
  DeliverableType,
  AuditAction,
  EntityType,
  RoleName,
} from '@hbc/sp-services';
import type { IEstimatingTracker } from '@hbc/sp-services';

// ── Styles ───────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  tabContent: {
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  inlineInput: {
    width: '100%',
    minWidth: '60px',
  },
  inlineCheckbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  currencyText: {
    fontVariantNumeric: 'tabular-nums',
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  drawerForm: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  drawerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalM, '0', '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  // ── Lightweight table styles ──
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  rowCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap' as const,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: tokens.fontSizeBase200,
  },
  th: {
    textAlign: 'left' as const,
    ...shorthands.padding('8px', '12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    whiteSpace: 'nowrap' as const,
  },
  td: {
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
    verticalAlign: 'middle' as const,
  },
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

// ── Types ────────────────────────────────────────────────────────────
type TabValue = 'estimate-log' | 'current-pursuits' | 'current-precon';

interface ITrackingColumn {
  key: string;
  header: string;
  width?: string;
  render: (row: IEstimatingTracker) => React.ReactNode;
}

interface INewEntryForm {
  Title: string;
  ProjectCode: string;
  Source: EstimateSource | '';
  DeliverableType: DeliverableType | '';
  EstimateType: DeliverableType | '';
  SubBidsDue: string;
  PreSubmissionReview: string;
  WinStrategyMeeting: string;
  DueDate_OutTheDoor: string;
  LeadEstimator: string;
  Contributors: string;
  PX_ProjectExecutive: string;
  CostPerGSF: string;
  CostPerUnit: string;
  AwardStatus: AwardStatus | '';
  NotesFeedback: string;
  DocSetStage: string;
  PreconFee: string;
  DesignBudget: string;
  FeePaidToDate: string;
  Chk_BidBond: boolean;
  Chk_PPBond: boolean;
  Chk_Schedule: boolean;
  Chk_Logistics: boolean;
  Chk_BIMProposal: boolean;
  Chk_PreconProposal: boolean;
  Chk_ProposalTabs: boolean;
  Chk_CoordMarketing: boolean;
  Chk_BusinessTerms: boolean;
}

const EMPTY_FORM: INewEntryForm = {
  Title: '', ProjectCode: '', Source: '', DeliverableType: '', EstimateType: '',
  SubBidsDue: '', PreSubmissionReview: '', WinStrategyMeeting: '', DueDate_OutTheDoor: '',
  LeadEstimator: '', Contributors: '', PX_ProjectExecutive: '',
  CostPerGSF: '', CostPerUnit: '', AwardStatus: '', NotesFeedback: '',
  DocSetStage: '', PreconFee: '', DesignBudget: '', FeePaidToDate: '',
  Chk_BidBond: false, Chk_PPBond: false, Chk_Schedule: false, Chk_Logistics: false,
  Chk_BIMProposal: false, Chk_PreconProposal: false, Chk_ProposalTabs: false,
  Chk_CoordMarketing: false, Chk_BusinessTerms: false,
};

// ── Helpers ──────────────────────────────────────────────────────────
const EDIT_ROLES: RoleName[] = [
  RoleName.EstimatingCoordinator, RoleName.OperationsTeam,
  RoleName.ExecutiveLeadership, RoleName.SharePointAdmin,
  RoleName.PreconstructionTeam, RoleName.DepartmentDirector,
];

const formatCurrency = (v: number | undefined | null): string =>
  v != null ? `$${v.toLocaleString()}` : '—';

// Stable array references — prevents React.memo defeat from Object.values() on every render
const DELIVERABLE_OPTIONS = Object.values(DeliverableType);
const ESTIMATE_SOURCE_OPTIONS = Object.values(EstimateSource);
const AWARD_STATUS_OPTIONS = Object.values(AwardStatus);

// ── Click-to-Edit Cell Components (stable references) ───────────────
// Defined outside main component so React never unmounts/remounts them.

interface IEditCellProps {
  rowId: number;
  field: string;
  onSave: (id: number, field: string, value: unknown) => void;
}

interface ITextCellProps extends IEditCellProps {
  value: string;
  cellClassName: string;
  inputClassName: string;
}

const EditableTextCell: React.FC<ITextCellProps> = React.memo(({
  rowId, field, value, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  React.useEffect(() => setLocalValue(value), [value]);
  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${localValue || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {localValue || '—'}
      </span>
    );
  }
  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      defaultValue={localValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const newVal = e.target.value;
        if (newVal !== localValue) {
          setLocalValue(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
});
EditableTextCell.displayName = 'EditableTextCell';

interface INumberCellProps extends IEditCellProps {
  numValue: number | undefined | null;
  isCurrency?: boolean;
  cellClassName: string;
  currencyClassName: string;
  inputClassName: string;
}

const EditableNumberCell: React.FC<INumberCellProps> = React.memo(({
  rowId, field, numValue, isCurrency, onSave, cellClassName, currencyClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localNum, setLocalNum] = React.useState(numValue);
  React.useEffect(() => setLocalNum(numValue), [numValue]);
  const display = isCurrency ? formatCurrency(localNum) : (localNum != null ? String(localNum) : '—');
  if (!editing) {
    return (
      <span
        className={mergeClasses(cellClassName, isCurrency ? currencyClassName : undefined)}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${display}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {display}
      </span>
    );
  }
  const strValue = localNum != null ? String(localNum) : '';
  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="number"
      defaultValue={strValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const newVal = e.target.value ? Number(e.target.value) : undefined;
        if (newVal !== localNum) {
          setLocalNum(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
});
EditableNumberCell.displayName = 'EditableNumberCell';

interface IDateCellProps extends IEditCellProps {
  isoValue: string | undefined | null;
  cellClassName: string;
  inputClassName: string;
}

const EditableDateCell: React.FC<IDateCellProps> = React.memo(({
  rowId, field, isoValue, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localIso, setLocalIso] = React.useState(isoValue);
  React.useEffect(() => setLocalIso(isoValue), [isoValue]);
  const dateStr = localIso ? localIso.split('T')[0] : '';
  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${dateStr || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {dateStr || '—'}
      </span>
    );
  }
  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="date"
      defaultValue={dateStr}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const newVal = e.target.value || undefined;
        if (newVal !== localIso) {
          setLocalIso(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
});
EditableDateCell.displayName = 'EditableDateCell';

interface ISelectCellProps extends IEditCellProps {
  value: string;
  options: string[];
  cellClassName: string;
  inputClassName: string;
}

const EditableSelectCell: React.FC<ISelectCellProps> = React.memo(({
  rowId, field, value, options, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  React.useEffect(() => setLocalValue(value), [value]);
  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${localValue || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {localValue || '—'}
      </span>
    );
  }
  return (
    <Select
      className={inputClassName}
      size="small"
      defaultValue={localValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const newVal = e.target.value || undefined;
        if (newVal !== localValue) {
          setLocalValue(newVal ?? '');
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    >
      <option value="">—</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </Select>
  );
});
EditableSelectCell.displayName = 'EditableSelectCell';

interface ICheckboxCellProps extends IEditCellProps {
  checked: boolean;
  wrapperClassName: string;
}

const EditableCheckboxCell: React.FC<ICheckboxCellProps> = React.memo(({
  rowId, field, checked: initialChecked, onSave, wrapperClassName,
}) => {
  const [checked, setChecked] = React.useState(initialChecked);
  React.useEffect(() => setChecked(initialChecked), [initialChecked]);
  return (
    <div className={wrapperClassName} onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={checked}
        aria-label={field}
        onChange={(_, d) => {
          const next = Boolean(d.checked);
          setChecked(next);
          onSave(rowId, field, next);
        }}
      />
    </div>
  );
});
EditableCheckboxCell.displayName = 'EditableCheckboxCell';

// ── Component ────────────────────────────────────────────────────────
export const DepartmentTrackingPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabValue>('estimate-log');

  // Data state — each tab has its own array
  const [estimateLog, setEstimateLog] = React.useState<IEstimatingTracker[]>([]);
  const [currentPursuits, setCurrentPursuits] = React.useState<IEstimatingTracker[]>([]);
  const [currentPrecon, setCurrentPrecon] = React.useState<IEstimatingTracker[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [form, setForm] = React.useState<INewEntryForm>({ ...EMPTY_FORM });

  // ── Data loading ─────────────────────────────────────────────────
  const loadData = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [log, pursuits, precon] = await Promise.all([
        dataService.getEstimateLog(),
        dataService.getCurrentPursuits(),
        dataService.getPreconEngagements(),
      ]);
      setEstimateLog(log);
      setCurrentPursuits(pursuits);
      setCurrentPrecon(precon);
    } catch {
      setEstimateLog([]);
      setCurrentPursuits([]);
      setCurrentPrecon([]);
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  React.useEffect(() => { void loadData(); }, [loadData]);

  // ── Inline edit handler (fire-and-forget — no parent state updates) ─
  // Cell components manage their own display values locally.
  // This handler only persists to the server + logs audit.
  const handleInlineEdit = React.useCallback(
    (id: number, field: string, value: unknown): void => {
      const patch = { [field]: value } as Partial<IEstimatingTracker>;
      void (async () => {
        try {
          await dataService.updateEstimatingRecord(id, patch);
          await dataService.logAudit({
            Action: AuditAction.EstimateStatusChanged,
            EntityType: EntityType.Estimate,
            EntityId: String(id),
            User: currentUser?.displayName ?? 'Unknown',
            Details: `Inline edit: ${field} updated`,
          });
        } catch {
          void loadData();
        }
      })();
    },
    [dataService, currentUser, loadData],
  );

  // ── New entry submission ─────────────────────────────────────────
  const handleNewEntry = React.useCallback(async (): Promise<void> => {
    try {
      const data: Partial<IEstimatingTracker> = {
        Title: form.Title,
        ProjectCode: form.ProjectCode,
        Source: (form.Source as EstimateSource) || undefined,
        DeliverableType: (form.DeliverableType as DeliverableType) || undefined,
        EstimateType: (form.EstimateType as DeliverableType) || undefined,
        SubBidsDue: form.SubBidsDue || undefined,
        PreSubmissionReview: form.PreSubmissionReview || undefined,
        WinStrategyMeeting: form.WinStrategyMeeting || undefined,
        DueDate_OutTheDoor: form.DueDate_OutTheDoor || undefined,
        LeadEstimator: form.LeadEstimator || undefined,
        Contributors: form.Contributors ? form.Contributors.split(',').map(s => s.trim()) : [],
        PX_ProjectExecutive: form.PX_ProjectExecutive || undefined,
        CostPerGSF: form.CostPerGSF ? Number(form.CostPerGSF) : undefined,
        CostPerUnit: form.CostPerUnit ? Number(form.CostPerUnit) : undefined,
        AwardStatus: (form.AwardStatus as AwardStatus) || undefined,
        NotesFeedback: form.NotesFeedback || undefined,
        DocSetStage: form.DocSetStage || undefined,
        PreconFee: form.PreconFee ? Number(form.PreconFee) : undefined,
        DesignBudget: form.DesignBudget ? Number(form.DesignBudget) : undefined,
        FeePaidToDate: form.FeePaidToDate ? Number(form.FeePaidToDate) : undefined,
        Chk_BidBond: form.Chk_BidBond,
        Chk_PPBond: form.Chk_PPBond,
        Chk_Schedule: form.Chk_Schedule,
        Chk_Logistics: form.Chk_Logistics,
        Chk_BIMProposal: form.Chk_BIMProposal,
        Chk_PreconProposal: form.Chk_PreconProposal,
        Chk_ProposalTabs: form.Chk_ProposalTabs,
        Chk_CoordMarketing: form.Chk_CoordMarketing,
        Chk_BusinessTerms: form.Chk_BusinessTerms,
      };

      await dataService.createEstimatingRecord(data);
      await dataService.logAudit({
        Action: AuditAction.EstimateCreated,
        EntityType: EntityType.Estimate,
        EntityId: '0',
        User: currentUser?.displayName ?? 'Unknown',
        Details: `New estimating record: ${form.Title}`,
      });

      setDrawerOpen(false);
      setForm({ ...EMPTY_FORM });
      void loadData();
    } catch {
      // Error handled silently
    }
  }, [form, dataService, currentUser, loadData]);

  // ── Column definitions ───────────────────────────────────────────

  // Shared style class names for cell components
  const cellCls = styles.editableCell;
  const inputCls = styles.inlineInput;
  const currCls = styles.currencyText;
  const chkCls = styles.inlineCheckbox;

  // Tab 1: Estimate Tracking Log
  const estimateLogColumns = React.useMemo((): ITrackingColumn[] => [
    { key: 'ProjectCode', header: 'Project #', width: '110px', render: (row) => (
      <EditableTextCell rowId={row.id} field="ProjectCode" value={String(row.ProjectCode ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'Title', header: 'Project Name', width: '200px', render: (row) => (
      <EditableTextCell rowId={row.id} field="Title" value={String(row.Title ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'EstimateType', header: 'Estimate Type', width: '140px', render: (row) => (
      <EditableSelectCell rowId={row.id} field="EstimateType" value={String(row.EstimateType ?? '')} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'CostPerGSF', header: 'Cost per GSF', width: '110px', render: (row) => (
      <EditableNumberCell rowId={row.id} field="CostPerGSF" numValue={row.CostPerGSF} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} />
    )},
    { key: 'CostPerUnit', header: 'Cost per Unit', width: '110px', render: (row) => (
      <EditableNumberCell rowId={row.id} field="CostPerUnit" numValue={row.CostPerUnit} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} />
    )},
    { key: 'SubmittedDate', header: 'Submitted', width: '130px', render: (row) => (
      <EditableDateCell rowId={row.id} field="SubmittedDate" isoValue={row.SubmittedDate} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    {
      key: 'Pending', header: 'Pending', width: '80px',
      render: (row) => {
        const isPending = row.AwardStatus === 'Pending' || !row.AwardStatus;
        return <span className={styles.statusPill} style={{ backgroundColor: isPending ? tokens.colorStatusWarningBackground2 : tokens.colorNeutralBackground3, color: isPending ? tokens.colorStatusWarningForeground2 : tokens.colorNeutralForeground3 }}>{isPending ? 'Yes' : 'No'}</span>;
      },
    },
    {
      key: 'AwardedWOPrecon', header: 'Awarded W/O Precon', width: '140px',
      render: (row) => row.AwardStatus === AwardStatus.AwardedWithoutPrecon
        ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusSuccessBackground2, color: tokens.colorStatusSuccessForeground2 }}>Yes</span>
        : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
    },
    {
      key: 'NotAwarded', header: 'Not Awarded', width: '100px',
      render: (row) => row.AwardStatus === AwardStatus.NotAwarded
        ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusDangerBackground2, color: tokens.colorStatusDangerForeground2 }}>Yes</span>
        : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
    },
    {
      key: 'AwardedWPrecon', header: 'Awarded W/ Precon', width: '130px',
      render: (row) => row.AwardStatus === AwardStatus.AwardedWithPrecon
        ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusSuccessBackground2, color: tokens.colorStatusSuccessForeground2 }}>Yes</span>
        : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
    },
    { key: 'LeadEstimator', header: 'Lead Estimator', width: '130px', render: (row) => (
      <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'NotesFeedback', header: 'Notes', width: '200px', render: (row) => (
      <EditableTextCell rowId={row.id} field="NotesFeedback" value={String(row.NotesFeedback ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
  ], [handleInlineEdit, cellCls, inputCls, currCls, styles.statusPill]);

  // Tab 2: Current Pursuits
  const currentPursuitsColumns = React.useMemo((): ITrackingColumn[] => [
    { key: 'ProjectCode', header: 'Project #', width: '110px', render: (row) => (
      <EditableTextCell rowId={row.id} field="ProjectCode" value={String(row.ProjectCode ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'Title', header: 'Project Name', width: '180px', render: (row) => (
      <EditableTextCell rowId={row.id} field="Title" value={String(row.Title ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'Source', header: 'Source', width: '120px', render: (row) => (
      <EditableSelectCell rowId={row.id} field="Source" value={String(row.Source ?? '')} options={ESTIMATE_SOURCE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'DeliverableType', header: 'Deliverable', width: '130px', render: (row) => (
      <EditableSelectCell rowId={row.id} field="DeliverableType" value={String(row.DeliverableType ?? '')} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'SubBidsDue', header: 'Sub Bids Due', width: '130px', render: (row) => (
      <EditableDateCell rowId={row.id} field="SubBidsDue" isoValue={row.SubBidsDue} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'PreSubmissionReview', header: 'Presubmission Review', width: '150px', render: (row) => (
      <EditableDateCell rowId={row.id} field="PreSubmissionReview" isoValue={row.PreSubmissionReview} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'WinStrategyMeeting', header: 'Win Strategy Meeting', width: '150px', render: (row) => (
      <EditableDateCell rowId={row.id} field="WinStrategyMeeting" isoValue={row.WinStrategyMeeting} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'DueDate_OutTheDoor', header: 'Due Date (Out the Door)', width: '160px', render: (row) => (
      <EditableDateCell rowId={row.id} field="DueDate_OutTheDoor" isoValue={row.DueDate_OutTheDoor} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'LeadEstimator', header: 'Lead Estimator', width: '130px', render: (row) => (
      <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'Contributors', header: 'Contributors', width: '130px', render: (row) => (
      <EditableTextCell rowId={row.id} field="Contributors" value={(row.Contributors ?? []).join(', ')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'PX_ProjectExecutive', header: 'PX', width: '130px', render: (row) => (
      <EditableTextCell rowId={row.id} field="PX_ProjectExecutive" value={String(row.PX_ProjectExecutive ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    // ── Estimating / BIM Checklist (each its own column) ──
    { key: 'Chk_BidBond', header: 'Bid Bond (Wanda)', width: '120px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_BidBond" checked={Boolean(row.Chk_BidBond)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_PPBond', header: 'P&P Bond', width: '100px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_PPBond" checked={Boolean(row.Chk_PPBond)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_Schedule', header: 'Schedule', width: '90px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_Schedule" checked={Boolean(row.Chk_Schedule)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_Logistics', header: 'Logistics', width: '90px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_Logistics" checked={Boolean(row.Chk_Logistics)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_BIMProposal', header: 'BIM Proposal', width: '110px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_BIMProposal" checked={Boolean(row.Chk_BIMProposal)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_PreconProposal', header: 'Precon Proposal (Ryan)', width: '150px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_PreconProposal" checked={Boolean(row.Chk_PreconProposal)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_ProposalTabs', header: 'Proposal Tabs (Wanda/Christina)', width: '190px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_ProposalTabs" checked={Boolean(row.Chk_ProposalTabs)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_CoordMarketing', header: 'Coor. w/ Marketing Prior to Sending', width: '220px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_CoordMarketing" checked={Boolean(row.Chk_CoordMarketing)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
    { key: 'Chk_BusinessTerms', header: 'Business Terms', width: '120px', render: (row) => (
      <EditableCheckboxCell rowId={row.id} field="Chk_BusinessTerms" checked={Boolean(row.Chk_BusinessTerms)} onSave={handleInlineEdit} wrapperClassName={chkCls} />
    )},
  ], [handleInlineEdit, cellCls, inputCls, chkCls]);

  // Tab 3: Current Preconstruction
  const currentPreconColumns = React.useMemo((): ITrackingColumn[] => [
    { key: 'ProjectCode', header: 'Project #', width: '110px', render: (row) => (
      <EditableTextCell rowId={row.id} field="ProjectCode" value={String(row.ProjectCode ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'Title', header: 'Project Name', width: '220px', render: (row) => (
      <EditableTextCell rowId={row.id} field="Title" value={String(row.Title ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'DocSetStage', header: 'Current Stage (as of date)', width: '180px', render: (row) => (
      <EditableTextCell rowId={row.id} field="DocSetStage" value={String(row.DocSetStage ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
    { key: 'PreconFee', header: 'Precon Budget', width: '130px', render: (row) => (
      <EditableNumberCell rowId={row.id} field="PreconFee" numValue={row.PreconFee} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} />
    )},
    { key: 'DesignBudget', header: 'Design Budget', width: '130px', render: (row) => (
      <EditableNumberCell rowId={row.id} field="DesignBudget" numValue={row.DesignBudget} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} />
    )},
    { key: 'FeePaidToDate', header: 'Billed to Date', width: '130px', render: (row) => (
      <EditableNumberCell rowId={row.id} field="FeePaidToDate" numValue={row.FeePaidToDate} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} />
    )},
    { key: 'LeadEstimator', header: 'Lead Estimator', width: '130px', render: (row) => (
      <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} />
    )},
  ], [handleInlineEdit, cellCls, inputCls, currCls]);

  // ── Active data / columns by tab ─────────────────────────────────
  const activeItems = activeTab === 'estimate-log' ? estimateLog
    : activeTab === 'current-pursuits' ? currentPursuits
    : currentPrecon;

  const activeColumns = activeTab === 'estimate-log' ? estimateLogColumns
    : activeTab === 'current-pursuits' ? currentPursuitsColumns
    : currentPreconColumns;

  // ── Filter state (replaces HbcDataTable's built-in search) ──
  const [filter, setFilter] = React.useState('');

  // Reset filter on tab switch
  React.useEffect(() => setFilter(''), [activeTab]);

  const filteredItems = React.useMemo(() => {
    if (!filter) return activeItems;
    const lower = filter.toLowerCase();
    return activeItems.filter(row =>
      Object.values(row).some(v => v != null && String(v).toLowerCase().includes(lower)),
    );
  }, [activeItems, filter]);

  // ── Drawer title by tab ──────────────────────────────────────────
  const drawerTitle = activeTab === 'estimate-log' ? 'New Estimate Log Entry'
    : activeTab === 'current-pursuits' ? 'New Pursuit Entry'
    : 'New Preconstruction Entry';

  // ── Form field updater ───────────────────────────────────────────
  const updateField = React.useCallback(<K extends keyof INewEntryForm>(field: K, value: INewEntryForm[K]): void => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Department Tracking"
        subtitle="Estimating & Preconstruction Tracking"
        actions={
          <RoleGate allowedRoles={EDIT_ROLES}>
            <HbcButton
              emphasis="strong"
              icon={<Add24Regular />}
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setDrawerOpen(true);
              }}
            >
              New Entry
            </HbcButton>
          </RoleGate>
        }
      />

      <div className={styles.container}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as TabValue)}
          aria-label="Department tracking tabs"
        >
          <Tab value="estimate-log">Estimate Tracking Log</Tab>
          <Tab value="current-pursuits">Current Pursuits</Tab>
          <Tab value="current-precon">Current Preconstruction</Tab>
        </TabList>

        <div className={styles.tabContent}>
          {/* Toolbar with search + row count */}
          <div className={styles.toolbar}>
            <Input
              value={filter}
              onChange={(_, d) => setFilter(d.value)}
              placeholder={`Search ${activeTab === 'estimate-log' ? 'estimate log' : activeTab === 'current-pursuits' ? 'pursuits' : 'preconstruction'}...`}
              aria-label="Filter table rows"
              size="small"
              style={{ maxWidth: 280 }}
            />
            <span className={styles.rowCount}>
              {filteredItems.length} of {activeItems.length} row(s)
            </span>
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <SkeletonLoader variant="table" rows={5} columns={activeColumns.length} />
          ) : filteredItems.length === 0 ? (
            <HbcEmptyState
              title="No records found"
              description="Use the New Entry button to create a record."
            />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label={`Department tracking - ${activeTab}`}>
                <thead>
                  <tr>
                    {activeColumns.map(col => (
                      <th key={col.key} className={styles.th} style={col.width ? { minWidth: col.width } : undefined}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(row => (
                    <tr key={row.id} className={styles.tr}>
                      {activeColumns.map(col => (
                        <td key={col.key} className={styles.td}>
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-out drawer for new entries ── */}
      <SlideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        width={480}
      >
        <div className={styles.drawerForm}>
          {/* Common fields */}
          <HbcField label="Project Name" required>
            <Input value={form.Title} onChange={(_, d) => updateField('Title', d.value)} />
          </HbcField>
          <HbcField label="Project #" required>
            <Input value={form.ProjectCode} onChange={(_, d) => updateField('ProjectCode', d.value)} />
          </HbcField>
          <HbcField label="Lead Estimator">
            <Input value={form.LeadEstimator} onChange={(_, d) => updateField('LeadEstimator', d.value)} />
          </HbcField>

          {/* Tab-specific fields */}
          {activeTab === 'estimate-log' && (
            <>
              <HbcField label="Estimate Type">
                <Select value={form.EstimateType} onChange={(e) => updateField('EstimateType', e.target.value as DeliverableType)}>
                  <option value="">Select...</option>
                  {DELIVERABLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </HbcField>
              <HbcField label="Cost per GSF">
                <Input type="number" value={form.CostPerGSF} onChange={(_, d) => updateField('CostPerGSF', d.value)} />
              </HbcField>
              <HbcField label="Cost per Unit">
                <Input type="number" value={form.CostPerUnit} onChange={(_, d) => updateField('CostPerUnit', d.value)} />
              </HbcField>
              <HbcField label="Award Status">
                <Select value={form.AwardStatus} onChange={(e) => updateField('AwardStatus', e.target.value as AwardStatus)}>
                  <option value="">Select...</option>
                  {AWARD_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </HbcField>
              <HbcField label="Notes">
                <Input value={form.NotesFeedback} onChange={(_, d) => updateField('NotesFeedback', d.value)} />
              </HbcField>
            </>
          )}

          {activeTab === 'current-pursuits' && (
            <>
              <HbcField label="Source">
                <Select value={form.Source} onChange={(e) => updateField('Source', e.target.value as EstimateSource)}>
                  <option value="">Select...</option>
                  {ESTIMATE_SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </HbcField>
              <HbcField label="Deliverable">
                <Select value={form.DeliverableType} onChange={(e) => updateField('DeliverableType', e.target.value as DeliverableType)}>
                  <option value="">Select...</option>
                  {DELIVERABLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </HbcField>
              <HbcField label="Sub Bids Due">
                <Input type="date" value={form.SubBidsDue} onChange={(_, d) => updateField('SubBidsDue', d.value)} />
              </HbcField>
              <HbcField label="Presubmission Review">
                <Input type="date" value={form.PreSubmissionReview} onChange={(_, d) => updateField('PreSubmissionReview', d.value)} />
              </HbcField>
              <HbcField label="Win Strategy Meeting">
                <Input type="date" value={form.WinStrategyMeeting} onChange={(_, d) => updateField('WinStrategyMeeting', d.value)} />
              </HbcField>
              <HbcField label="Due Date (Out the Door)">
                <Input type="date" value={form.DueDate_OutTheDoor} onChange={(_, d) => updateField('DueDate_OutTheDoor', d.value)} />
              </HbcField>
              <HbcField label="Contributors (comma-separated)">
                <Input value={form.Contributors} onChange={(_, d) => updateField('Contributors', d.value)} />
              </HbcField>
              <HbcField label="PX (Project Executive)">
                <Input value={form.PX_ProjectExecutive} onChange={(_, d) => updateField('PX_ProjectExecutive', d.value)} />
              </HbcField>
              <HbcField label="Checklist Items">
                <div style={{ display: 'grid', gap: '4px' }}>
                  <Checkbox label="Bid Bond (Wanda)" checked={form.Chk_BidBond} onChange={(_, d) => updateField('Chk_BidBond', Boolean(d.checked))} />
                  <Checkbox label="P&P Bond" checked={form.Chk_PPBond} onChange={(_, d) => updateField('Chk_PPBond', Boolean(d.checked))} />
                  <Checkbox label="Schedule" checked={form.Chk_Schedule} onChange={(_, d) => updateField('Chk_Schedule', Boolean(d.checked))} />
                  <Checkbox label="Logistics" checked={form.Chk_Logistics} onChange={(_, d) => updateField('Chk_Logistics', Boolean(d.checked))} />
                  <Checkbox label="BIM Proposal" checked={form.Chk_BIMProposal} onChange={(_, d) => updateField('Chk_BIMProposal', Boolean(d.checked))} />
                  <Checkbox label="Precon Proposal (Ryan)" checked={form.Chk_PreconProposal} onChange={(_, d) => updateField('Chk_PreconProposal', Boolean(d.checked))} />
                  <Checkbox label="Proposal Tabs (Wanda/Christina)" checked={form.Chk_ProposalTabs} onChange={(_, d) => updateField('Chk_ProposalTabs', Boolean(d.checked))} />
                  <Checkbox label="Coor. w/ Marketing" checked={form.Chk_CoordMarketing} onChange={(_, d) => updateField('Chk_CoordMarketing', Boolean(d.checked))} />
                  <Checkbox label="Business Terms" checked={form.Chk_BusinessTerms} onChange={(_, d) => updateField('Chk_BusinessTerms', Boolean(d.checked))} />
                </div>
              </HbcField>
            </>
          )}

          {activeTab === 'current-precon' && (
            <>
              <HbcField label="Current Stage">
                <Input value={form.DocSetStage} onChange={(_, d) => updateField('DocSetStage', d.value)} />
              </HbcField>
              <HbcField label="Precon Budget">
                <Input type="number" value={form.PreconFee} onChange={(_, d) => updateField('PreconFee', d.value)} />
              </HbcField>
              <HbcField label="Design Budget">
                <Input type="number" value={form.DesignBudget} onChange={(_, d) => updateField('DesignBudget', d.value)} />
              </HbcField>
              <HbcField label="Billed to Date">
                <Input type="number" value={form.FeePaidToDate} onChange={(_, d) => updateField('FeePaidToDate', d.value)} />
              </HbcField>
            </>
          )}

          <div className={styles.drawerActions}>
            <HbcButton onClick={() => setDrawerOpen(false)}>Cancel</HbcButton>
            <HbcButton
              emphasis="strong"
              disabled={!form.Title || !form.ProjectCode}
              onClick={() => void handleNewEntry()}
            >
              Create Entry
            </HbcButton>
          </div>
        </div>
      </SlideDrawer>
    </div>
  );
};
