import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Link,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Select,
  TabList,
  Tab,
  Textarea,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowMaximize24Regular,
  ArrowMinimize24Regular,
  // Stage 18 Sub-task 6b: Meeting Review Mode icons
  SlideText24Regular,
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
  Timer24Regular,
  Dismiss24Regular,
  NoteEdit24Regular,
  Send24Regular,
  DocumentBulletList24Regular,
  TargetArrow24Regular,
  BuildingFactory24Regular,
} from '@fluentui/react-icons';
import { HBC_COLORS, ELEVATION, SPACING } from '../../../theme/tokens';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useToast } from '../../shared/ToastContainer';
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
  ExportService,
  PERMISSIONS,
  RoleName,
  formatCurrency,
} from '@hbc/sp-services';
import type { IEstimatingTracker } from '@hbc/sp-services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { qk } from '../../../tanstack/query/queryKeys';

// TODO (Stage 19+): Dark-mode parity & mobile-responsive drawer for field estimator use | Audit: usability | Impact: Medium

// ── Styles ───────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  kpiCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  kpiLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  kpiValue: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightBold,
  },
  kpiSubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginLeft: 'auto',
  },
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  rowCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap' as const,
  },
  fullscreenContainer: {
    position: 'fixed',
    inset: '0',
    zIndex: 9999,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    overflowY: 'auto',
  },
  actionLink: {
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    textDecorationLine: 'underline',
    textDecorationThickness: 'from-font',
    textUnderlineOffset: '2px',
  },
  drawerDetails: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  drawerDetailRow: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
  },
  drawerDetailLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  drawerDetailValue: {
    color: tokens.colorNeutralForeground1,
  },
  // Stage 18 Sub-task 4: toolbar row for Edit/Done actions inside project-details drawer
  drawerEditToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding('0', '0', tokens.spacingVerticalS),
  },
  // ── Stage 18 Sub-task 6b: Meeting Review Mode styles ──
  meetingToolbarBtn: {
    fontWeight: tokens.fontWeightSemibold,
  },
  spotlightContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: '80vh',
    backgroundColor: HBC_COLORS.gray50,
  },
  spotlightHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(SPACING.lg, SPACING.lg),
    backgroundColor: HBC_COLORS.navy,
    boxShadow: ELEVATION.level2,
    flexShrink: 0,
  },
  spotlightTitle: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: '#FFFFFF',
    lineHeight: 1.2,
  },
  spotlightProjectCode: {
    color: HBC_COLORS.orange,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
    marginLeft: '12px',
  },
  spotlightProgress: {
    fontSize: tokens.fontSizeBase400,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: tokens.fontWeightSemibold,
  },
  spotlightProgressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.borderRadius('3px'),
    marginTop: '8px',
  },
  spotlightProgressBarFill: {
    height: '100%',
    backgroundColor: HBC_COLORS.orange,
    ...shorthands.borderRadius('3px'),
    transitionProperty: 'width',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-out',
  },
  spotlightBody: {
    flex: 1,
    overflowY: 'auto' as const,
    ...shorthands.padding(SPACING.xl, SPACING.xl),
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  spotlightBodyInner: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column' as const,
    ...shorthands.gap(SPACING.lg),
  },
  // TODO (Stage 19 – Sub-task 3): In the Estimating tab (after existing attachment controls), add "Attach Full Estimate Workbook" button + progress toast using existing HbcFileUpload and optimistic TanStack Query mutation pattern. On success, call ExcelDeepBidImportService and invalidate relevant queries. Gate behind DeepBidImportEnabled flag. Reference: plan UI upload deliverable and reuse of current attachment flow.
  spotlightSectionBanner: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding(SPACING.sm, SPACING.md),
    backgroundColor: HBC_COLORS.gray50,
    boxShadow: ELEVATION.level1,
    ...shorthands.borderRadius('6px'),
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  spotlightFieldCard: {
    backgroundColor: '#FFFFFF',
    boxShadow: ELEVATION.level1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray200),
  },
  spotlightFieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(SPACING.lg),
  },
  spotlightFieldRow: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    ...shorthands.gap(SPACING.md),
    alignItems: 'center',
    ...shorthands.padding(SPACING.sm, SPACING.md),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
  },
  spotlightFieldRowAlt: {
    backgroundColor: HBC_COLORS.gray50,
  },
  // TODO (Stage 19 – Sub-task 18): In Estimating tab (Project Details panel), replace/extend static fields with dynamic `KickOffSection` renderer. Each section must support inline edit, field removal, "+ Add custom field" button. Reference **reference/Estimating Kickoff Template.xlsx** for 100% field fidelity and existing HbcDataTable patterns.
  spotlightFieldLabel: {
    color: HBC_COLORS.textGray,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  spotlightPanel: {
    backgroundColor: '#FFFFFF',
    boxShadow: ELEVATION.level1,
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray200),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
  },
  spotlightPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('0', '0', SPACING.md, '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    marginBottom: SPACING.md,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: HBC_COLORS.navy,
    paddingLeft: SPACING.md,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  spotlightFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(SPACING.lg, SPACING.lg),
    backgroundColor: HBC_COLORS.gray50,
    boxShadow: '0 -2px 6px rgba(0,0,0,0.08)',
    flexShrink: 0,
  },
  spotlightNavGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  spotlightTimerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  timerDisplay: {
    fontVariantNumeric: 'tabular-nums',
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '56px',
    textAlign: 'center' as const,
  },
  reviewedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('14px'),
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusSuccessBackground2,
    color: tokens.colorStatusSuccessForeground2,
  },
  // TODO (Stage 19 – Sub-task 24): In Estimating tab (Project Details panel, after Kick-Off section), add dynamic `PostBidAutopsySection` renderer with inline edit, field removal, and "+ Add custom field". Reference **reference/Estimating - Post Bid Autopsy.xlsx** for 100% field fidelity.
  spotlightNotesList: {
    maxHeight: '320px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    ...shorthands.gap(SPACING.sm),
  },
  spotlightNoteEntry: {
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray200),
    ...shorthands.borderRadius('6px'),
    ...shorthands.padding(SPACING.sm, SPACING.md),
    backgroundColor: HBC_COLORS.gray50,
  },
  spotlightNoteTimestamp: {
    fontSize: tokens.fontSizeBase200,
    color: HBC_COLORS.textGray,
    fontStyle: 'italic' as const,
  },
  spotlightNoteUser: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    marginLeft: '8px',
  },
  spotlightNoteText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginTop: '4px',
    whiteSpace: 'pre-wrap' as const,
  },
  spotlightNoteInput: {
    display: 'flex',
    ...shorthands.gap(SPACING.sm),
    alignItems: 'flex-end',
    marginTop: SPACING.md,
  },
});

// TODO (Stage 19 – Sub-task 4): Extend the existing SlideDrawer (Meeting Review Mode pattern) with new "Deep Bid Review" pane. If multiple versions detected, render side-by-side comparison of parsed summaries/GC&GRs; allow estimator to confirm/override primary selection. Persist choice via TanStack Query. Reference: plan review & selection UI deliverable.

// ── Types ────────────────────────────────────────────────────────────
type TabValue = 'estimate-log' | 'current-pursuits' | 'current-precon';
interface ITrackingKpiCard {
  key: string;
  label: string;
  value: string;
  subtitle: string;
}

interface ISortState {
  field: string;
  asc: boolean;
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
const EDIT_ROLES: RoleName[] = Object.values(RoleName) as RoleName[];
const MEETING_TIMER_LIMIT = 300; // 5 minutes per project (Stage 18 Sub-task 7: hoisted to module scope)

// Stable array references — prevents React.memo defeat from Object.values() on every render
const DELIVERABLE_OPTIONS = Object.values(DeliverableType);
const ESTIMATE_SOURCE_OPTIONS = Object.values(EstimateSource);
const AWARD_STATUS_OPTIONS = Object.values(AwardStatus);
const NUMERIC_FIELDS = new Set(['CostPerGSF', 'CostPerUnit', 'PreconFee', 'DesignBudget', 'FeePaidToDate']);
const BOOLEAN_FIELDS = new Set([
  'Chk_BidBond', 'Chk_PPBond', 'Chk_Schedule', 'Chk_Logistics',
  'Chk_BIMProposal', 'Chk_PreconProposal', 'Chk_ProposalTabs', 'Chk_CoordMarketing', 'Chk_BusinessTerms',
]);

function validateInlineField(
  field: string,
  value: unknown,
): { ok: true; normalized: unknown } | { ok: false; message: string } {
  if (field === 'ProjectCode' || field === 'Title') {
    return { ok: false, message: `${field} is locked for Stage 18 Sub-task 3.` };
  }

  if (field === 'Source') {
    const normalized = value ? String(value) : '';
    if (!normalized || ESTIMATE_SOURCE_OPTIONS.includes(normalized as EstimateSource)) {
      return { ok: true, normalized: normalized || undefined };
    }
    return { ok: false, message: 'Invalid Source value.' };
  }

  if (field === 'DeliverableType' || field === 'EstimateType') {
    const normalized = value ? String(value) : '';
    if (!normalized || DELIVERABLE_OPTIONS.includes(normalized as DeliverableType)) {
      return { ok: true, normalized: normalized || undefined };
    }
    return { ok: false, message: `Invalid ${field} value.` };
  }

  if (field === 'AwardStatus') {
    const normalized = value ? String(value) : '';
    if (!normalized || AWARD_STATUS_OPTIONS.includes(normalized as AwardStatus)) {
      return { ok: true, normalized: normalized || undefined };
    }
    return { ok: false, message: 'Invalid Award Status value.' };
  }

  if (field === 'Contributors') {
    if (Array.isArray(value)) {
      return { ok: true, normalized: value.map((entry) => String(entry).trim()).filter(Boolean) };
    }
    const normalized = String(value ?? '').trim();
    return {
      ok: true,
      normalized: normalized ? normalized.split(',').map((entry) => entry.trim()).filter(Boolean) : [],
    };
  }

  if (NUMERIC_FIELDS.has(field)) {
    if (value === undefined || value === null || value === '') {
      return { ok: true, normalized: undefined };
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, message: `${field} must be a valid non-negative number.` };
    }
    return { ok: true, normalized: parsed };
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return { ok: true, normalized: Boolean(value) };
  }

  if (field === 'MeetingNotes') {
    if (Array.isArray(value)) {
      return { ok: true, normalized: value };
    }
    return { ok: true, normalized: value ?? [] };
  }

  if (typeof value === 'string') {
    return { ok: true, normalized: value.trim() };
  }

  return { ok: true, normalized: value };
}

type EstimatingTabData = ReadonlyArray<IEstimatingTracker>;
type EstimatingQuerySnapshot = readonly [ReadonlyArray<unknown>, EstimatingTabData | undefined];
type TrackingColumnDef = ColumnDef<IEstimatingTracker, unknown>;

interface ITrackingColumnMeta {
  key: string;
  width?: string;
  render: (row: IEstimatingTracker) => React.ReactNode;
}

const columnHelper = createColumnHelper<IEstimatingTracker>();

function getTabQueryKey(scope: ReturnType<typeof useQueryScope>, tab: TabValue): ReadonlyArray<unknown> {
  switch (tab) {
    case 'estimate-log':
      return qk.estimating.log(scope);
    case 'current-pursuits':
      return qk.estimating.pursuits(scope);
    case 'current-precon':
      return qk.estimating.engagements(scope);
  }
}

function patchRecord(
  records: EstimatingTabData,
  id: number,
  patch: Partial<IEstimatingTracker>
): IEstimatingTracker[] {
  return records.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

function toHbcColumns(
  columnDefs: TrackingColumnDef[],
): IHbcDataTableColumn<IEstimatingTracker>[] {
  return columnDefs.map((columnDef, index) => {
    const meta = columnDef.meta as ITrackingColumnMeta | undefined;
    const key = meta?.key ?? columnDef.id ?? `column-${index}`;
    const header = typeof columnDef.header === 'string' ? columnDef.header : key;

    return {
      key,
      header,
      width: meta?.width,
      sortable: columnDef.enableSorting ?? true,
      render: (row: IEstimatingTracker) => meta?.render(row) ?? '—',
    };
  });
}

function applyGlobalFilter(
  items: ReadonlyArray<IEstimatingTracker>,
  term: string,
): IEstimatingTracker[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return [...items];
  }

  return items.filter((row) =>
    Object.values(row).some((value) => {
      if (value == null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.join(', ').toLowerCase().includes(normalized);
      }
      return String(value).toLowerCase().includes(normalized);
    }),
  );
}

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
  const cancelledRef = React.useRef(false);
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
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value;
        if (newVal !== localValue) {
          setLocalValue(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          cancelledRef.current = true;
          setEditing(false);
        }
      }}
    />
  );
});
EditableTextCell.displayName = 'EditableTextCell';

// TODO (Stage 19 – Sub-task 5): In KPI cards, HbcDataTable (inline-editable), and Meeting Review Mode, auto-populate primary summary/GC&GR values from the normalized IEstimateSummary/IGCGRScenario. Use existing useQueryScope and query-key patterns with optimistic updates. Data must render identically to current mock data once imported. Reference: plan integration deliverable.

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
  const cancelledRef = React.useRef(false);
  React.useEffect(() => setLocalNum(numValue), [numValue]);
  const display = isCurrency ? formatCurrency(localNum, { placeholder: '—', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : (localNum != null ? String(localNum) : '—');
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
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value ? Number(e.target.value) : undefined;
        if (newVal !== localNum) {
          setLocalNum(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          cancelledRef.current = true;
          setEditing(false);
        }
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
  const cancelledRef = React.useRef(false);
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
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value || undefined;
        if (newVal !== localIso) {
          setLocalIso(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          cancelledRef.current = true;
          setEditing(false);
        }
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

// ── Stage 18 Sub-task 6b: blur-to-save Textarea for meeting notes/action items ──
interface IMeetingTextareaProps {
  rowId: number;
  field: string;
  value: string;
  placeholder: string;
  rows?: number;
  onSave: (id: number, field: string, value: unknown) => void;
}

const MeetingTextarea: React.FC<IMeetingTextareaProps> = React.memo(({
  rowId, field, value, placeholder, rows = 4, onSave,
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  React.useEffect(() => setLocalValue(value), [value]);
  return (
    <Textarea
      value={localValue}
      onChange={(_, d) => setLocalValue(d.value)}
      onBlur={() => {
        if (localValue !== value) {
          onSave(rowId, field, localValue);
        }
      }}
      placeholder={placeholder}
      resize="vertical"
      rows={rows}
    />
  );
});
MeetingTextarea.displayName = 'MeetingTextarea';

// ── Stage 18 Sub-task 6b: Threaded Meeting Notes component ──
// TODO (Stage 19 – Sub-task 10): Wrap import flow in React 18 useTransition; ensure TanStack Query caching prevents impact on lazy-loaded routes. Validate <8 s parse time on 5 MB+ workbooks. Reference: plan performance & scale testing deliverable.

const formatNoteTimestamp = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

interface IMeetingNotesThreadProps {
  rowId: number;
  notes: Array<{ timestamp: string; user: string; text: string }>;
  currentUserName: string;
  onSave: (id: number, field: string, value: unknown) => void;
  styles: {
    panel: string;
    panelHeader: string;
    notesList: string;
    noteEntry: string;
    noteTimestamp: string;
    noteUser: string;
    noteText: string;
    noteInput: string;
  };
}

const MeetingNotesThread: React.FC<IMeetingNotesThreadProps> = React.memo(({
  rowId, notes, currentUserName, onSave, styles: s,
}) => {
  const [draft, setDraft] = React.useState('');
  const reversed = React.useMemo(() => (notes ?? []).slice().reverse(), [notes]);

  const handlePost = (): void => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newEntry = {
      timestamp: new Date().toISOString(),
      user: currentUserName,
      text: trimmed,
    };
    onSave(rowId, 'MeetingNotes', [...(notes ?? []), newEntry]);
    setDraft('');
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <NoteEdit24Regular />
        Meeting Notes
      </div>
      {reversed.length > 0 && (
        <div className={s.notesList}>
          {reversed.map((note, i) => (
            <div key={`${note.timestamp}-${i}`} className={s.noteEntry}>
              <div>
                <span className={s.noteTimestamp}>{formatNoteTimestamp(note.timestamp)}</span>
                <span className={s.noteUser}>{note.user}</span>
              </div>
              <div className={s.noteText}>{note.text}</div>
            </div>
          ))}
        </div>
      )}
      <div className={s.noteInput}>
        <Textarea
          value={draft}
          onChange={(_, d) => setDraft(d.value)}
          placeholder="Add a meeting note..."
          resize="vertical"
          rows={2}
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handlePost();
            }
          }}
        />
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          disabled={!draft.trim()}
          onClick={handlePost}
        >
          Post Note
        </Button>
      </div>
    </div>
  );
});
MeetingNotesThread.displayName = 'MeetingNotesThread';

// ── Stage 18 Sub-task 7: Extracted as standalone React.memo for stable column-def memoization ──
interface IProjectActionsMenuProps {
  row: IEstimatingTracker;
  label: string;
  canViewMenu: boolean;
  canViewProjectHub: boolean;
  canOpenGoNoGo: boolean;
  onOpenDetails: (row: IEstimatingTracker) => void;
  onNavigateHub: (row: IEstimatingTracker) => void;
  onNavigateGoNoGo: (row: IEstimatingTracker) => void;
  // Stage 19: Turnover menu item — enabled when AwardStatus is "Awarded w/ Precon" or "Awarded w/o Precon"
  onNavigateTurnover: (row: IEstimatingTracker) => void;
  actionLinkClassName: string;
  editRoles: RoleName[];
}

const ProjectActionsMenu = React.memo(function ProjectActionsMenu(props: IProjectActionsMenuProps): React.ReactElement {
  if (!props.canViewMenu) {
    return <span>{props.label || '—'}</span>;
  }

  return (
    <RoleGate allowedRoles={props.editRoles}>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Link
            className={props.actionLinkClassName}
            onClick={(event) => event.stopPropagation()}
            aria-haspopup="menu"
          >
            {props.label || '—'}
          </Link>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => props.onOpenDetails(props.row)}>Project Details</MenuItem>
            <MenuItem disabled={!props.canViewProjectHub} onClick={() => props.onNavigateHub(props.row)}>
              Project Hub
            </MenuItem>
            <MenuItem disabled={!props.canOpenGoNoGo} onClick={() => props.onNavigateGoNoGo(props.row)}>
              Go/No-Go Scorecard
            </MenuItem>
            {/* routing defined in future route-map.md */}
            <MenuItem disabled>Kickoff</MenuItem>
            <MenuItem disabled>Deliverable Tracking</MenuItem>
            {/* Stage 19: Turnover menu item — conditional on Award Status per SOP.
                Enabled only when AwardStatus is "Awarded w/ Precon" or "Awarded w/o Precon". */}
            <MenuItem
              disabled={
                props.row.AwardStatus !== AwardStatus.AwardedWithPrecon &&
                props.row.AwardStatus !== AwardStatus.AwardedWithoutPrecon
              }
              onClick={() => props.onNavigateTurnover(props.row)}
            >
              Turnover
            </MenuItem>
            <MenuItem disabled>Autopsy</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </RoleGate>
  );
});
ProjectActionsMenu.displayName = 'ProjectActionsMenu';
// TODO (Stage 19+): Voice-to-text for meeting notes using Web Speech API + Fluent UI integration | Audit: usability & inclusivity | Impact: Medium

// ── Component ────────────────────────────────────────────────────────
export const DepartmentTrackingPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [isPendingSave, startTransition] = React.useTransition();
  // TODO (Stage 19+): Migrate HbcDataTable to TanStack Table virtualized rows for 500+ bid records | Audit: large-table performance budget | Impact: High
  // Stage 18 Sub-task 7: non-blocking UI transitions for tab switches, meeting mode, exports.
  const [, startUITransition] = React.useTransition();
  const activeSaveKeyRef = React.useRef<string | null>(null);
  const exportServiceRef = React.useRef(new ExportService());
  const fullscreenRootRef = React.useRef<HTMLDivElement | null>(null);
  const [isTableFullscreen, setIsTableFullscreen] = React.useState(false);

  // Stage 18 Sub-task 6b: Meeting Review Mode state
  const [isMeetingMode, setIsMeetingMode] = React.useState(false);
  const [meetingIndex, setMeetingIndex] = React.useState(0);
  const [meetingAutoAdvance, setMeetingAutoAdvance] = React.useState(false);
  const [meetingTimerSeconds, setMeetingTimerSeconds] = React.useState(0);
  const [meetingTimerRunning, setMeetingTimerRunning] = React.useState(false);
  const meetingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabValue>('estimate-log');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<'new-entry' | 'project-details'>('new-entry');
  const [selectedProjectRow, setSelectedProjectRow] = React.useState<IEstimatingTracker | null>(null);
  const [isDrawerEditing, setIsDrawerEditing] = React.useState(false); // Stage 18 Sub-task 4: edit toggle for project-details drawer
  const [form, setForm] = React.useState<INewEntryForm>({ ...EMPTY_FORM });

  const permissionSet = currentUser?.permissions ?? new Set<string>();
  const canReadEstimating = permissionSet.has(PERMISSIONS.ESTIMATING_READ);
  const canEditEstimating = permissionSet.has(PERMISSIONS.ESTIMATING_EDIT);
  const canViewMenu = canReadEstimating || canEditEstimating;
  const canViewProjectHub = permissionSet.has(PERMISSIONS.PROJECT_HUB_VIEW);
  const canViewGoNoGo = permissionSet.has(PERMISSIONS.GONOGO_READ);
  // Stage 18 Sub-task 7: feature flag gating point — when an 'EstimatingDepartmentTracking' flag
  // is defined, gate Meeting Mode and exports behind isFeatureEnabled('EstimatingDepartmentTracking').

  const estimateLogQuery = useQuery({
    queryKey: qk.estimating.log(scope),
    queryFn: () => dataService.getEstimateLog(),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
  const currentPursuitsQuery = useQuery({
    queryKey: qk.estimating.pursuits(scope),
    queryFn: () => dataService.getCurrentPursuits(),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
  const currentPreconQuery = useQuery({
    queryKey: qk.estimating.engagements(scope),
    queryFn: () => dataService.getPreconEngagements(),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
  const goNoGoScorecardsQuery = useQuery({
    queryKey: ['gonogo', 'scorecards', 'project-actions-menu'],
    queryFn: () => dataService.getScorecards(),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateRecordMutation = useMutation<
    IEstimatingTracker,
    Error,
    { id: number; field: string; patch: Partial<IEstimatingTracker> },
    { snapshots: EstimatingQuerySnapshot[] }
  >({
    mutationFn: ({ id, patch }) => dataService.updateEstimatingRecord(id, patch),
    retry: 1,
    // Optimistically patch all estimating tab caches so inline edit feels instant.
    onMutate: async ({ id, patch }) => {
      const baseKey = qk.estimating.base(scope);
      await queryClient.cancelQueries({ queryKey: baseKey });
      const snapshots = queryClient.getQueriesData<EstimatingTabData>({ queryKey: baseKey });

      snapshots.forEach(([queryKey, previous]) => {
        if (!Array.isArray(previous)) {
          return;
        }
        queryClient.setQueryData<IEstimatingTracker[]>(queryKey, patchRecord(previous, id, patch));
      });
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous);
      });
    },
    onSuccess: async (_updated, { id, field }) => {
      try {
        await dataService.logAudit({
          Action: AuditAction.EstimateStatusChanged,
          EntityType: EntityType.Estimate,
          EntityId: String(id),
          User: currentUser?.displayName ?? 'Unknown',
          Details: `Inline edit: ${field} updated`,
        });
      } catch {
        // Persisted data should not be blocked by audit transport failures.
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
    },
  });

  // ── Inline edit handler ──────────────────────────────────────────
  const handleInlineEdit = React.useCallback(
    (id: number, field: string, value: unknown): void => {
      const validation = validateInlineField(field, value);
      if (!validation.ok) {
        addToast(validation.message, 'error', 4000);
        return;
      }

      const saveKey = `${id}:${field}`;
      if ((updateRecordMutation.isPending || isPendingSave) && activeSaveKeyRef.current === saveKey) {
        return;
      }
      activeSaveKeyRef.current = saveKey;

      // Stage 18: keep inline saves non-blocking under React 18 concurrent rendering.
      startTransition(() => {
        void updateRecordMutation.mutateAsync({
          id,
          field,
          patch: { [field]: validation.normalized } as Partial<IEstimatingTracker>,
        }).then(() => {
          addToast(`${field} saved`, 'success', 2500);
        }).catch(() => {
          addToast(`Unable to save ${field}.`, 'error', 4000);
        }).finally(() => {
          if (activeSaveKeyRef.current === saveKey) {
            activeSaveKeyRef.current = null;
          }
        });
      });
    },
    [updateRecordMutation, isPendingSave, addToast],
  );

  const createRecordMutation = useMutation<
    IEstimatingTracker,
    Error,
    { data: Partial<IEstimatingTracker>; tab: TabValue; title: string },
    { snapshots: EstimatingQuerySnapshot[] }
  >({
    mutationFn: ({ data }) => dataService.createEstimatingRecord(data),
    retry: 1,
    onMutate: async ({ data, tab }) => {
      const baseKey = qk.estimating.base(scope);
      await queryClient.cancelQueries({ queryKey: baseKey });
      const snapshots = queryClient.getQueriesData<EstimatingTabData>({ queryKey: baseKey });
      const tabQueryKey = getTabQueryKey(scope, tab);
      const optimisticRecord: IEstimatingTracker = {
        ...(data as IEstimatingTracker),
        id: -Date.now(),
        LeadID: data.LeadID ?? 0,
        Title: data.Title ?? '',
        ProjectCode: data.ProjectCode ?? '',
      };

      queryClient.setQueryData<IEstimatingTracker[]>(tabQueryKey, (current = []) => [optimisticRecord, ...current]);
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous);
      });
    },
    onSuccess: async (created, { title }) => {
      try {
        await dataService.logAudit({
          Action: AuditAction.EstimateCreated,
          EntityType: EntityType.Estimate,
          EntityId: String(created.id),
          User: currentUser?.displayName ?? 'Unknown',
          Details: `New estimating record: ${title}`,
        });
      } catch {
        // Persisted data should not be blocked by audit transport failures.
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
    },
  });

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

      await createRecordMutation.mutateAsync({
        data,
        tab: activeTab,
        title: form.Title,
      });
      setDrawerOpen(false);
      setForm({ ...EMPTY_FORM });
    } catch {
      // Error handled silently
    }
  }, [form, activeTab, createRecordMutation]);

  // ── Column definitions ───────────────────────────────────────────

  // Shared style class names for cell components
  const cellCls = styles.editableCell;
  const inputCls = styles.inlineInput;
  const currCls = styles.currencyText;
  const chkCls = styles.inlineCheckbox;

  // Stage 18 Sub-task 7: action-menu handlers hoisted before column defs for stable renderActionMenu.
  const hasGoNoGoScorecardForRow = React.useCallback((row: IEstimatingTracker): boolean => {
    const scorecards = Array.isArray(goNoGoScorecardsQuery.data)
      ? goNoGoScorecardsQuery.data as Array<{ LeadID?: number; ProjectCode?: string }>
      : [];
    if (scorecards.length === 0) {
      return false;
    }

    const rowLeadId = Number(row.LeadID ?? 0);
    const rowProjectCode = String(row.ProjectCode ?? '').trim().toLowerCase();
    return scorecards.some((card) => {
      const cardLeadId = Number(card.LeadID ?? 0);
      const cardProjectCode = String(card.ProjectCode ?? '').trim().toLowerCase();
      return (rowLeadId > 0 && cardLeadId === rowLeadId)
        || (rowProjectCode.length > 0 && cardProjectCode === rowProjectCode);
    });
  }, [goNoGoScorecardsQuery.data]);

  const handleOpenProjectDetails = React.useCallback((row: IEstimatingTracker): void => {
    setSelectedProjectRow(row);
    setDrawerMode('project-details');
    setDrawerOpen(true);
  }, []);

  const handleNavigateProjectHub = React.useCallback((row: IEstimatingTracker): void => {
    // Stage 19 routing fix: Pass projectCode for cross-workspace navigation.
    // Project Hub layout no longer blocks on context.selectedProject; dashboard
    // route accepts projectCode search param as fallback.
    void navigate({ to: '/project-hub/dashboard', search: { projectCode: row.ProjectCode } });
  }, [navigate]);

  const handleNavigateGoNoGo = React.useCallback((row: IEstimatingTracker): void => {
    void row;
    void navigate({ to: '/preconstruction/bd/go-no-go' });
  }, [navigate]);

  // Stage 19: Navigate to turnover page for the selected project.
  // For turnover page usage guide, see docs/turnover-meeting-guide.md
  // Award Status guard is enforced in the ProjectActionsMenu component (MenuItem disabled prop).
  const handleNavigateTurnover = React.useCallback((row: IEstimatingTracker): void => {
    // Stage 19 Sub-task 2: Pass leadId for on-demand turnover agenda initialization.
    // createTurnoverAgenda(projectCode, leadId) needs both params to seed the agenda
    // with lead data (estimate overview, team assignments, financial roll-up).
    void navigate({
      to: '/project-hub/precon/turnover',
      search: { projectCode: row.ProjectCode, leadId: row.LeadID },
    });
  }, [navigate]);

  // Stage 18 Sub-task 7: stable render callback for ProjectActionsMenu — prevents column def re-memoization.
  const renderActionMenu = React.useCallback(
    (row: IEstimatingTracker, label: string) => (
      <ProjectActionsMenu
        row={row}
        label={label}
        canViewMenu={canViewMenu}
        canViewProjectHub={canViewProjectHub}
        canOpenGoNoGo={canViewGoNoGo && hasGoNoGoScorecardForRow(row)}
        onOpenDetails={handleOpenProjectDetails}
        onNavigateHub={handleNavigateProjectHub}
        onNavigateGoNoGo={handleNavigateGoNoGo}
        onNavigateTurnover={handleNavigateTurnover}
        actionLinkClassName={styles.actionLink}
        editRoles={EDIT_ROLES}
      />
    ),
    [canViewMenu, canViewProjectHub, canViewGoNoGo, hasGoNoGoScorecardForRow, handleOpenProjectDetails, handleNavigateProjectHub, handleNavigateGoNoGo, handleNavigateTurnover, styles.actionLink],
  );

  // Stage 18: author columns as TanStack ColumnDef[] and bridge locally for HbcDataTable.
  const estimateLogColumnDefs = React.useMemo((): TrackingColumnDef[] => [
    columnHelper.accessor((row) => row.ProjectCode ?? '', {
      id: 'ProjectCode',
      header: 'Project #',
      enableSorting: true,
      enableGrouping: true,
      // Stage 18 Sub-task 4: Project # now opens row-level action menu.
      meta: { key: 'ProjectCode', width: '110px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.ProjectCode ?? '—')) },
    }),
    columnHelper.accessor((row) => row.Title ?? '', {
      id: 'Title',
      header: 'Project Name',
      enableSorting: true,
      enableGrouping: true,
      // Stage 18 Sub-task 4: Project Name now opens row-level action menu.
      meta: { key: 'Title', width: '200px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.Title ?? '—')) },
    }),
    columnHelper.accessor((row) => row.EstimateType ?? '', {
      id: 'EstimateType',
      header: 'Estimate Type',
      enableSorting: true,
      enableGrouping: true,
      meta: { key: 'EstimateType', width: '140px', render: (row: IEstimatingTracker) => <EditableSelectCell rowId={row.id} field="EstimateType" value={String(row.EstimateType ?? '')} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> },
    }),
    columnHelper.accessor((row) => row.CostPerGSF ?? 0, {
      id: 'CostPerGSF',
      header: 'Cost per GSF',
      enableSorting: true,
      enableGrouping: false,
      meta: { key: 'CostPerGSF', width: '110px', render: (row: IEstimatingTracker) => <EditableNumberCell rowId={row.id} field="CostPerGSF" numValue={row.CostPerGSF} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} /> },
    }),
    columnHelper.accessor((row) => row.CostPerUnit ?? 0, {
      id: 'CostPerUnit',
      header: 'Cost per Unit',
      enableSorting: true,
      enableGrouping: false,
      meta: { key: 'CostPerUnit', width: '110px', render: (row: IEstimatingTracker) => <EditableNumberCell rowId={row.id} field="CostPerUnit" numValue={row.CostPerUnit} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} /> },
    }),
    columnHelper.accessor((row) => row.SubmittedDate ?? '', {
      id: 'SubmittedDate',
      header: 'Submitted',
      enableSorting: true,
      enableGrouping: false,
      meta: { key: 'SubmittedDate', width: '130px', render: (row: IEstimatingTracker) => <EditableDateCell rowId={row.id} field="SubmittedDate" isoValue={row.SubmittedDate} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> },
    }),
    columnHelper.accessor((row) => row.AwardStatus ?? 'Pending', {
      id: 'Pending',
      header: 'Pending',
      enableSorting: true,
      enableGrouping: false,
      meta: {
        key: 'Pending',
        width: '80px',
        render: (row: IEstimatingTracker) => {
          const isPending = row.AwardStatus === 'Pending' || !row.AwardStatus;
          return <span className={styles.statusPill} style={{ backgroundColor: isPending ? tokens.colorStatusWarningBackground2 : tokens.colorNeutralBackground3, color: isPending ? tokens.colorStatusWarningForeground2 : tokens.colorNeutralForeground3 }}>{isPending ? 'Yes' : 'No'}</span>;
        },
      },
    }),
    columnHelper.accessor((row) => row.AwardStatus ?? '', {
      id: 'AwardedWOPrecon',
      header: 'Awarded W/O Precon',
      enableSorting: true,
      enableGrouping: false,
      meta: {
        key: 'AwardedWOPrecon',
        width: '140px',
        render: (row: IEstimatingTracker) => row.AwardStatus === AwardStatus.AwardedWithoutPrecon
          ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusSuccessBackground2, color: tokens.colorStatusSuccessForeground2 }}>Yes</span>
          : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
      },
    }),
    columnHelper.accessor((row) => row.AwardStatus ?? '', {
      id: 'NotAwarded',
      header: 'Not Awarded',
      enableSorting: true,
      enableGrouping: false,
      meta: {
        key: 'NotAwarded',
        width: '100px',
        render: (row: IEstimatingTracker) => row.AwardStatus === AwardStatus.NotAwarded
          ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusDangerBackground2, color: tokens.colorStatusDangerForeground2 }}>Yes</span>
          : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
      },
    }),
    columnHelper.accessor((row) => row.AwardStatus ?? '', {
      id: 'AwardedWPrecon',
      header: 'Awarded W/ Precon',
      enableSorting: true,
      enableGrouping: false,
      meta: {
        key: 'AwardedWPrecon',
        width: '130px',
        render: (row: IEstimatingTracker) => row.AwardStatus === AwardStatus.AwardedWithPrecon
          ? <span className={styles.statusPill} style={{ backgroundColor: tokens.colorStatusSuccessBackground2, color: tokens.colorStatusSuccessForeground2 }}>Yes</span>
          : <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>,
      },
    }),
    columnHelper.accessor((row) => row.LeadEstimator ?? '', {
      id: 'LeadEstimator',
      header: 'Lead Estimator',
      enableSorting: true,
      enableGrouping: true,
      meta: { key: 'LeadEstimator', width: '130px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> },
    }),
    columnHelper.accessor((row) => row.NotesFeedback ?? '', {
      id: 'NotesFeedback',
      header: 'Notes',
      enableSorting: true,
      enableGrouping: false,
      meta: { key: 'NotesFeedback', width: '200px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="NotesFeedback" value={String(row.NotesFeedback ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> },
    }),
  ], [handleInlineEdit, cellCls, inputCls, currCls, styles.statusPill, renderActionMenu]);

  const currentPursuitsColumnDefs = React.useMemo((): TrackingColumnDef[] => [
    columnHelper.accessor((row) => row.ProjectCode ?? '', { id: 'ProjectCode', header: 'Project #', enableSorting: true, enableGrouping: true, meta: { key: 'ProjectCode', width: '110px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.ProjectCode ?? '—')) } }),
    columnHelper.accessor((row) => row.Title ?? '', { id: 'Title', header: 'Project Name', enableSorting: true, enableGrouping: true, meta: { key: 'Title', width: '180px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.Title ?? '—')) } }),
    columnHelper.accessor((row) => row.Source ?? '', { id: 'Source', header: 'Source', enableSorting: true, enableGrouping: true, meta: { key: 'Source', width: '120px', render: (row: IEstimatingTracker) => <EditableSelectCell rowId={row.id} field="Source" value={String(row.Source ?? '')} options={ESTIMATE_SOURCE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.DeliverableType ?? '', { id: 'DeliverableType', header: 'Deliverable', enableSorting: true, enableGrouping: true, meta: { key: 'DeliverableType', width: '130px', render: (row: IEstimatingTracker) => <EditableSelectCell rowId={row.id} field="DeliverableType" value={String(row.DeliverableType ?? '')} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.SubBidsDue ?? '', { id: 'SubBidsDue', header: 'Sub Bids Due', enableSorting: true, enableGrouping: false, meta: { key: 'SubBidsDue', width: '130px', render: (row: IEstimatingTracker) => <EditableDateCell rowId={row.id} field="SubBidsDue" isoValue={row.SubBidsDue} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.PreSubmissionReview ?? '', { id: 'PreSubmissionReview', header: 'Presubmission Review', enableSorting: true, enableGrouping: false, meta: { key: 'PreSubmissionReview', width: '150px', render: (row: IEstimatingTracker) => <EditableDateCell rowId={row.id} field="PreSubmissionReview" isoValue={row.PreSubmissionReview} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.WinStrategyMeeting ?? '', { id: 'WinStrategyMeeting', header: 'Win Strategy Meeting', enableSorting: true, enableGrouping: false, meta: { key: 'WinStrategyMeeting', width: '150px', render: (row: IEstimatingTracker) => <EditableDateCell rowId={row.id} field="WinStrategyMeeting" isoValue={row.WinStrategyMeeting} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.DueDate_OutTheDoor ?? '', { id: 'DueDate_OutTheDoor', header: 'Due Date (Out the Door)', enableSorting: true, enableGrouping: false, meta: { key: 'DueDate_OutTheDoor', width: '160px', render: (row: IEstimatingTracker) => <EditableDateCell rowId={row.id} field="DueDate_OutTheDoor" isoValue={row.DueDate_OutTheDoor} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.LeadEstimator ?? '', { id: 'LeadEstimator', header: 'Lead Estimator', enableSorting: true, enableGrouping: true, meta: { key: 'LeadEstimator', width: '130px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => (row.Contributors ?? []).join(', '), { id: 'Contributors', header: 'Contributors', enableSorting: true, enableGrouping: false, meta: { key: 'Contributors', width: '130px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="Contributors" value={(row.Contributors ?? []).join(', ')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.PX_ProjectExecutive ?? '', { id: 'PX_ProjectExecutive', header: 'PX', enableSorting: true, enableGrouping: true, meta: { key: 'PX_ProjectExecutive', width: '130px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="PX_ProjectExecutive" value={String(row.PX_ProjectExecutive ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_BidBond)), { id: 'Chk_BidBond', header: 'Bid Bond (Wanda)', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_BidBond', width: '120px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_BidBond" checked={Boolean(row.Chk_BidBond)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_PPBond)), { id: 'Chk_PPBond', header: 'P&P Bond', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_PPBond', width: '100px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_PPBond" checked={Boolean(row.Chk_PPBond)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_Schedule)), { id: 'Chk_Schedule', header: 'Schedule', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_Schedule', width: '90px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_Schedule" checked={Boolean(row.Chk_Schedule)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_Logistics)), { id: 'Chk_Logistics', header: 'Logistics', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_Logistics', width: '90px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_Logistics" checked={Boolean(row.Chk_Logistics)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_BIMProposal)), { id: 'Chk_BIMProposal', header: 'BIM Proposal', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_BIMProposal', width: '110px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_BIMProposal" checked={Boolean(row.Chk_BIMProposal)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_PreconProposal)), { id: 'Chk_PreconProposal', header: 'Precon Proposal (Ryan)', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_PreconProposal', width: '150px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_PreconProposal" checked={Boolean(row.Chk_PreconProposal)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_ProposalTabs)), { id: 'Chk_ProposalTabs', header: 'Proposal Tabs (Wanda/Christina)', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_ProposalTabs', width: '190px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_ProposalTabs" checked={Boolean(row.Chk_ProposalTabs)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_CoordMarketing)), { id: 'Chk_CoordMarketing', header: 'Coor. w/ Marketing Prior to Sending', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_CoordMarketing', width: '220px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_CoordMarketing" checked={Boolean(row.Chk_CoordMarketing)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
    columnHelper.accessor((row) => Number(Boolean(row.Chk_BusinessTerms)), { id: 'Chk_BusinessTerms', header: 'Business Terms', enableSorting: true, enableGrouping: false, meta: { key: 'Chk_BusinessTerms', width: '120px', render: (row: IEstimatingTracker) => <EditableCheckboxCell rowId={row.id} field="Chk_BusinessTerms" checked={Boolean(row.Chk_BusinessTerms)} onSave={handleInlineEdit} wrapperClassName={chkCls} /> } }),
  ], [handleInlineEdit, cellCls, inputCls, chkCls, renderActionMenu]);

  const currentPreconColumnDefs = React.useMemo((): TrackingColumnDef[] => [
    columnHelper.accessor((row) => row.ProjectCode ?? '', { id: 'ProjectCode', header: 'Project #', enableSorting: true, enableGrouping: true, meta: { key: 'ProjectCode', width: '110px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.ProjectCode ?? '—')) } }),
    columnHelper.accessor((row) => row.Title ?? '', { id: 'Title', header: 'Project Name', enableSorting: true, enableGrouping: true, meta: { key: 'Title', width: '220px', render: (row: IEstimatingTracker) => renderActionMenu(row, String(row.Title ?? '—')) } }),
    columnHelper.accessor((row) => row.DocSetStage ?? '', { id: 'DocSetStage', header: 'Current Stage (as of date)', enableSorting: true, enableGrouping: true, meta: { key: 'DocSetStage', width: '180px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="DocSetStage" value={String(row.DocSetStage ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.PreconFee ?? 0, { id: 'PreconFee', header: 'Precon Budget', enableSorting: true, enableGrouping: false, meta: { key: 'PreconFee', width: '130px', render: (row: IEstimatingTracker) => <EditableNumberCell rowId={row.id} field="PreconFee" numValue={row.PreconFee} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.DesignBudget ?? 0, { id: 'DesignBudget', header: 'Design Budget', enableSorting: true, enableGrouping: false, meta: { key: 'DesignBudget', width: '130px', render: (row: IEstimatingTracker) => <EditableNumberCell rowId={row.id} field="DesignBudget" numValue={row.DesignBudget} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.FeePaidToDate ?? 0, { id: 'FeePaidToDate', header: 'Billed to Date', enableSorting: true, enableGrouping: false, meta: { key: 'FeePaidToDate', width: '130px', render: (row: IEstimatingTracker) => <EditableNumberCell rowId={row.id} field="FeePaidToDate" numValue={row.FeePaidToDate} isCurrency onSave={handleInlineEdit} cellClassName={cellCls} currencyClassName={currCls} inputClassName={inputCls} /> } }),
    columnHelper.accessor((row) => row.LeadEstimator ?? '', { id: 'LeadEstimator', header: 'Lead Estimator', enableSorting: true, enableGrouping: true, meta: { key: 'LeadEstimator', width: '130px', render: (row: IEstimatingTracker) => <EditableTextCell rowId={row.id} field="LeadEstimator" value={String(row.LeadEstimator ?? '')} onSave={handleInlineEdit} cellClassName={cellCls} inputClassName={inputCls} /> } }),
  ], [handleInlineEdit, cellCls, inputCls, currCls, renderActionMenu]);

  // HbcDataTable currently accepts IHbcDataTableColumn, so map the local ColumnDef[] in-page.
  const estimateLogColumns = React.useMemo(
    () => toHbcColumns(estimateLogColumnDefs),
    [estimateLogColumnDefs],
  );
  const currentPursuitsColumns = React.useMemo(
    () => toHbcColumns(currentPursuitsColumnDefs),
    [currentPursuitsColumnDefs],
  );
  const currentPreconColumns = React.useMemo(
    () => toHbcColumns(currentPreconColumnDefs),
    [currentPreconColumnDefs],
  );

  // ── Active data / columns by tab ─────────────────────────────────
  const estimateLog = estimateLogQuery.data ?? [];
  const currentPursuits = currentPursuitsQuery.data ?? [];
  const currentPrecon = currentPreconQuery.data ?? [];
  const loading = estimateLogQuery.isLoading || currentPursuitsQuery.isLoading || currentPreconQuery.isLoading;

  const activeItems = activeTab === 'estimate-log' ? estimateLog
    : activeTab === 'current-pursuits' ? currentPursuits
    : currentPrecon;

  // Stage 18 Sub-task 4: derive live row from query cache so drawer reflects optimistic updates
  const liveProjectRow = React.useMemo(() => {
    if (!selectedProjectRow) return null;
    return activeItems.find((r) => r.id === selectedProjectRow.id) ?? selectedProjectRow;
  }, [selectedProjectRow, activeItems]);

  const activeColumns = activeTab === 'estimate-log' ? estimateLogColumns
    : activeTab === 'current-pursuits' ? currentPursuitsColumns
    : currentPreconColumns;
  const activeColumnDefs = activeTab === 'estimate-log' ? estimateLogColumnDefs
    : activeTab === 'current-pursuits' ? currentPursuitsColumnDefs
    : currentPreconColumnDefs;

  // ── Filter state (kept page-local to preserve existing toolbar UX) ──
  const [filter, setFilter] = React.useState('');
  const deferredFilter = React.useDeferredValue(filter);

  const [groupByByTab, setGroupByByTab] = React.useState<Record<TabValue, string[]>>({
    'estimate-log': ['AwardStatus'],
    'current-pursuits': ['LeadEstimator'],
    'current-precon': ['LeadEstimator'],
  });
  const [columnVisibilityByTab, setColumnVisibilityByTab] = React.useState<Record<TabValue, Record<string, boolean>>>({
    'estimate-log': {},
    'current-pursuits': {},
    'current-precon': {},
  });
  const [sortByByTab, setSortByByTab] = React.useState<Record<TabValue, ISortState | null>>({
    'estimate-log': null,
    'current-pursuits': null,
    'current-precon': null,
  });

  const closeDrawer = React.useCallback(() => {
    setDrawerOpen(false);
    setDrawerMode('new-entry');
    setSelectedProjectRow(null);
    setIsDrawerEditing(false); // Stage 18 Sub-task 4: reset edit mode on close
  }, []);

  // Stage 18 Sub-task 7: ProjectActionsMenu extracted to file-scope React.memo (see above).

  // Reset filter on tab switch
  React.useEffect(() => setFilter(''), [activeTab]);

  const filteredItems = React.useMemo(
    () => applyGlobalFilter(activeItems, deferredFilter),
    [activeItems, deferredFilter],
  );
  const tabLabel = activeTab === 'estimate-log'
    ? 'Estimate Log'
    : activeTab === 'current-pursuits'
      ? 'Pursuits'
      : 'Precon';

  const handleSortChange = React.useCallback((tab: TabValue, field: string): void => {
    setSortByByTab((previous) => {
      const current = previous[tab];
      const asc = current?.field === field ? !current.asc : true;
      return { ...previous, [tab]: { field, asc } };
    });
  }, []);

  const handleToggleFullscreen = React.useCallback(async (): Promise<void> => {
    const rootElement = fullscreenRootRef.current;
    if (!rootElement || typeof document === 'undefined') {
      return;
    }

    const isNativeFullscreenActive = document.fullscreenElement === rootElement;
    if (isTableFullscreen || isNativeFullscreenActive) {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => undefined);
      }
      setIsTableFullscreen(false);
      return;
    }

    // Stage 18 Sub-task 6: native fullscreen preferred; fixed-position fallback stays active for SPFx host constraints.
    setIsTableFullscreen(true);
    if (rootElement.requestFullscreen) {
      await rootElement.requestFullscreen().catch(() => undefined);
    }
  }, [isTableFullscreen]);

  React.useEffect(() => {
    const onFullscreenChange = (): void => {
      if (typeof document === 'undefined') {
        return;
      }
      setIsTableFullscreen(document.fullscreenElement === fullscreenRootRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // ── Stage 18 Sub-task 6b: Meeting Review Mode helpers ──────────────
  // TODO (Stage 19+): Implement real-time co-editing (SharePoint live / SignalR) for concurrent estimator notes & actions | Audit: engagement in weekly department meetings | Impact: High
  // TODO (Stage 19+): Surface Operational Excellence readiness KPI once project moves to Project Hub | Audit: visibility across precon/ops boundary | Impact: Medium

  // Navigate through the current tab's filtered dataset
  const meetingTotal = filteredItems.length;
  const clampedMeetingIndex = Math.min(meetingIndex, Math.max(0, meetingTotal - 1));
  const currentMeetingProject = meetingTotal > 0 ? filteredItems[clampedMeetingIndex] : null;

  // Derive live row from query cache (same pattern as drawer liveProjectRow)
  const liveMeetingProject = React.useMemo(() => {
    if (!currentMeetingProject) return null;
    return activeItems.find((r) => r.id === currentMeetingProject.id) ?? currentMeetingProject;
  }, [currentMeetingProject, activeItems]);

  const handleEnterMeetingMode = React.useCallback((): void => {
    // Stage 18 Sub-task 7: non-blocking meeting mode entry via useTransition
    startUITransition(() => {
      setIsMeetingMode(true);
      setMeetingIndex(0);
      setMeetingTimerSeconds(0);
      setMeetingTimerRunning(false);
    });
    if (!isTableFullscreen) {
      void handleToggleFullscreen();
    }
  }, [isTableFullscreen, handleToggleFullscreen, startUITransition]);

  const handleExitMeetingMode = React.useCallback((): void => {
    // Stage 18 Sub-task 7: non-blocking meeting mode exit via useTransition
    startUITransition(() => {
      setIsMeetingMode(false);
      setMeetingTimerRunning(false);
    });
    if (meetingTimerRef.current) {
      clearInterval(meetingTimerRef.current);
      meetingTimerRef.current = null;
    }
    if (isTableFullscreen) {
      void handleToggleFullscreen();
    }
  }, [isTableFullscreen, handleToggleFullscreen, startUITransition]);

  const handleMeetingPrev = React.useCallback((): void => {
    setMeetingIndex((i) => Math.max(0, i - 1));
    setMeetingTimerSeconds(0);
  }, []);

  const handleMeetingNext = React.useCallback((): void => {
    setMeetingIndex((i) => Math.min(meetingTotal - 1, i + 1));
    setMeetingTimerSeconds(0);
  }, [meetingTotal]);

  const handleMarkReviewed = React.useCallback((): void => {
    if (!currentMeetingProject) return;
    handleInlineEdit(currentMeetingProject.id, 'MeetingReviewed', true);
  }, [currentMeetingProject, handleInlineEdit]);

  // Per-project timer with optional auto-advance
  React.useEffect(() => {
    if (!isMeetingMode || !meetingTimerRunning) {
      if (meetingTimerRef.current) {
        clearInterval(meetingTimerRef.current);
        meetingTimerRef.current = null;
      }
      return;
    }
    meetingTimerRef.current = setInterval(() => {
      setMeetingTimerSeconds((s) => {
        const next = s + 1;
        if (next >= MEETING_TIMER_LIMIT && meetingAutoAdvance) {
          setMeetingIndex((i) => Math.min(meetingTotal - 1, i + 1));
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (meetingTimerRef.current) {
        clearInterval(meetingTimerRef.current);
        meetingTimerRef.current = null;
      }
    };
  }, [isMeetingMode, meetingTimerRunning, meetingAutoAdvance, meetingTotal, MEETING_TIMER_LIMIT]);

  // Reset timer on project change
  React.useEffect(() => {
    if (isMeetingMode) {
      setMeetingTimerSeconds(0);
    }
  }, [meetingIndex, isMeetingMode]);

  // ArrowLeft/Right keyboard navigation in meeting mode
  React.useEffect(() => {
    if (!isMeetingMode) return;
    const handleMeetingKeyDown = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMeetingPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMeetingNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleExitMeetingMode();
      }
    };
    document.addEventListener('keydown', handleMeetingKeyDown);
    return () => document.removeEventListener('keydown', handleMeetingKeyDown);
  }, [isMeetingMode, handleMeetingPrev, handleMeetingNext, handleExitMeetingMode]);

  const getColumnKey = React.useCallback((columnDef: TrackingColumnDef, index: number): string => {
    const meta = columnDef.meta as ITrackingColumnMeta | undefined;
    return meta?.key ?? columnDef.id ?? `column-${index}`;
  }, []);

  const getColumnHeader = React.useCallback((columnDef: TrackingColumnDef, index: number): string => {
    return typeof columnDef.header === 'string' ? columnDef.header : getColumnKey(columnDef, index);
  }, [getColumnKey]);

  const getCellValue = React.useCallback((row: IEstimatingTracker, columnDef: TrackingColumnDef): string => {
    const accessorFn = (columnDef as { accessorFn?: (entry: IEstimatingTracker) => unknown }).accessorFn;
    const rawValue = accessorFn ? accessorFn(row) : '';
    if (rawValue == null) {
      return '';
    }
    if (Array.isArray(rawValue)) {
      return rawValue.map((entry) => String(entry)).join(', ');
    }
    return String(rawValue);
  }, []);

  const buildExportRows = React.useCallback((): Record<string, unknown>[] => {
    const visibility = columnVisibilityByTab[activeTab] ?? {};
    const groupedBy = groupByByTab[activeTab] ?? [];
    const sortState = sortByByTab[activeTab];

    const visibleDefs = activeColumnDefs.filter((columnDef, index) => {
      const key = getColumnKey(columnDef, index);
      return visibility[key] !== false;
    });

    const sortedRows = [...filteredItems];
    sortedRows.sort((left, right) => {
      for (const groupKey of groupedBy) {
        const groupColumn = activeColumnDefs.find((columnDef, index) => getColumnKey(columnDef, index) === groupKey);
        if (!groupColumn) {
          continue;
        }
        const leftValue = getCellValue(left, groupColumn);
        const rightValue = getCellValue(right, groupColumn);
        const compare = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
        if (compare !== 0) {
          return compare;
        }
      }

      if (!sortState) {
        return 0;
      }

      const sortColumn = activeColumnDefs.find((columnDef, index) => getColumnKey(columnDef, index) === sortState.field);
      if (!sortColumn) {
        return 0;
      }
      const leftValue = getCellValue(left, sortColumn);
      const rightValue = getCellValue(right, sortColumn);
      const compare = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortState.asc ? compare : -compare;
    });

    return sortedRows.map((row) => {
      const exportRow: Record<string, unknown> = {};
      visibleDefs.forEach((columnDef, index) => {
        exportRow[getColumnHeader(columnDef, index)] = getCellValue(row, columnDef);
      });
      return exportRow;
    });
  }, [
    activeColumnDefs,
    activeTab,
    columnVisibilityByTab,
    filteredItems,
    getCellValue,
    getColumnHeader,
    getColumnKey,
    groupByByTab,
    sortByByTab,
  ]);

  const downloadBlob = React.useCallback((filename: string, mimeType: string, content: string): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }, []);

  const exportBaseName = React.useMemo(() => {
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    return `department-tracking-${activeTab}-${timestamp}`;
  }, [activeTab]);

  const handleExportCsv = React.useCallback((): void => {
    // Stage 18 Sub-task 7: non-blocking CSV generation via useTransition
    startUITransition(() => {
      const rows = buildExportRows();
      if (rows.length === 0) {
        addToast('No rows to export for the current view.', 'warning', 3000);
        return;
      }

      const headers = Object.keys(rows[0]);
      const escapeCsv = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const lines = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
      ];
      // Stage 18 Sub-task 6: keep CSV export lightweight and derived from live table state.
      downloadBlob(`${exportBaseName}.csv`, 'text/csv;charset=utf-8', lines.join('\n'));
    });
  }, [addToast, buildExportRows, downloadBlob, exportBaseName, startUITransition]);

  const handleExportExcel = React.useCallback(async (): Promise<void> => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      addToast('No rows to export for the current view.', 'warning', 3000);
      return;
    }

    try {
      await exportServiceRef.current.exportToExcel(rows, {
        filename: exportBaseName,
        title: `Department Tracking - ${tabLabel}`,
      });
    } catch {
      addToast('Unable to export Excel file.', 'error', 4000);
    }
  }, [addToast, buildExportRows, exportBaseName, tabLabel]);

  const handleExportPdf = React.useCallback((): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const previousTitle = document.title;
    document.title = `Department Tracking - ${tabLabel}`;
    // TODO (future Stage 18+ / export-products roadmap): Enhance PDF export styling – headers, titles, page sizes, date labels, page numbers, etc. (see export products enhancement list).
    window.print();
    document.title = previousTitle;
  }, [tabLabel]);

  // TODO (Stage 19+): Offline-first export queue with IndexedDB fallback for field estimators on spotty Wi-Fi | Audit: stability (offline resilience) | Impact: High
  // TODO (Stage 19+): Add "Mark as Awarded" action that triggers handoff mutation + deep-link to /project/[id]/hub | Audit: estimator-to-ops transition | Impact: High

  // TODO (Stage 19+): Add personalized estimator dashboard widgets (e.g., "My Bids Closing This Week") with TanStack Query prefetch | Audit: engagement & effectiveness | Impact: Medium
  // Stage 18 Sub-task 5: derive KPI cards directly from live tab query rows (no additional service calls).
  const trackingKpis = React.useMemo((): ITrackingKpiCard[] => {
    const toNumber = (value: unknown): number => {
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parseDateMs = (value?: string): number | null => {
      if (!value) {
        return null;
      }
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const openBidVolumeRaw = activeItems.reduce((sum, row) => {
      if (activeTab === 'current-precon') {
        return sum + toNumber(row.PreconFee);
      }
      return sum + toNumber(row.CostPerGSF ?? row.CostPerUnit);
    }, 0);

    const dueThisWeekCount = activeItems.reduce((count, row) => {
      const candidate = activeTab === 'estimate-log'
        ? row.SubmittedDate ?? row.DueDate_OutTheDoor
        : row.DueDate_OutTheDoor ?? row.SubBidsDue;
      const dateMs = parseDateMs(candidate);
      if (dateMs == null) {
        return count;
      }
      return dateMs >= startOfWeek.getTime() && dateMs < endOfWeek.getTime() ? count + 1 : count;
    }, 0);

    const totalPreconFee = activeItems.reduce((sum, row) => sum + toNumber(row.PreconFee), 0);
    const wonCount = activeItems.filter((row) =>
      row.AwardStatus === AwardStatus.AwardedWithPrecon || row.AwardStatus === AwardStatus.AwardedWithoutPrecon
    ).length;
    const decidedCount = activeItems.filter((row) =>
      row.AwardStatus != null && row.AwardStatus !== AwardStatus.Pending
    ).length;
    const wonRate = decidedCount > 0 ? Math.round((wonCount / decidedCount) * 100) : null;

    return [
      {
        key: 'activity',
        label: 'Activity Level',
        value: String(activeItems.length),
        subtitle: `${tabLabel} active projects`,
      },
      {
        key: 'open-volume',
        label: 'Open Bid Volume',
        value: formatCurrency(openBidVolumeRaw, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        subtitle: activeTab === 'current-precon' ? 'Summed from Precon Fee' : 'Summed from Cost / GSF',
      },
      {
        key: 'due-this-week',
        label: activeTab === 'estimate-log' ? 'Submissions This Week' : 'Bids Due This Week',
        value: String(dueThisWeekCount),
        subtitle: 'Current calendar week',
      },
      {
        key: 'precon-fee',
        label: 'Total Precon Fee',
        value: formatCurrency(totalPreconFee, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        subtitle: 'From active tab records',
      },
      {
        key: 'won-rate',
        label: 'Won Rate',
        value: wonRate == null ? '—' : `${wonRate}%`,
        subtitle: `${wonCount} won / ${decidedCount} decided`,
      },
    ];
  }, [activeItems, activeTab, tabLabel]);

  // ── Drawer title by tab ──────────────────────────────────────────
  const drawerTitle = drawerMode === 'project-details'
    ? `Project Details – ${String(selectedProjectRow?.ProjectCode ?? '—')}`
    : activeTab === 'estimate-log' ? 'New Estimate Log Entry'
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
                setDrawerMode('new-entry');
                setSelectedProjectRow(null);
                setDrawerOpen(true);
              }}
            >
              New Entry
            </HbcButton>
          </RoleGate>
        }
      />

      <div ref={fullscreenRootRef} className={mergeClasses(styles.container, isTableFullscreen && styles.fullscreenContainer)}>
        {/* Stage 18 Sub-task 6b: Meeting Review Mode spotlight — replaces normal view when active */}
        {isMeetingMode && liveMeetingProject ? (
          <div className={styles.spotlightContainer} role="region" aria-label="Meeting review spotlight">
            {/* Spotlight header — navy bar with white title + orange project code */}
            <div className={styles.spotlightHeader}>
              <div>
                <div className={styles.spotlightTitle}>
                  {liveMeetingProject.Title || '—'}
                  <span className={styles.spotlightProjectCode}>
                    {liveMeetingProject.ProjectCode || ''}
                  </span>
                  {liveMeetingProject.MeetingReviewed && (
                    <span className={styles.reviewedBadge} style={{ marginLeft: '12px', verticalAlign: 'middle' }}>Reviewed</span>
                  )}
                </div>
                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <span className={styles.spotlightProgress} role="status" aria-live="polite">
                    Project {clampedMeetingIndex + 1} of {meetingTotal}
                  </span>
                  <div
                    className={styles.spotlightProgressBarTrack}
                    style={{ flex: 1, maxWidth: '300px' }}
                    role="progressbar"
                    aria-valuenow={clampedMeetingIndex + 1}
                    aria-valuemin={1}
                    aria-valuemax={meetingTotal}
                    aria-label="Meeting review progress"
                  >
                    <div
                      className={styles.spotlightProgressBarFill}
                      style={{ width: meetingTotal > 0 ? `${((clampedMeetingIndex + 1) / meetingTotal) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={handleExitMeetingMode} style={{ color: 'rgba(255,255,255,0.85)' }} aria-label="Exit meeting review mode">
                Exit Meeting Mode
              </Button>
            </div>

            {/* Spotlight body */}
            <div className={styles.spotlightBody}>
              <div className={styles.spotlightBodyInner}>
                {/* Section banner — tab-context colored */}
                <div
                  className={styles.spotlightSectionBanner}
                  style={{
                    borderLeft: `4px solid ${
                      activeTab === 'estimate-log' ? HBC_COLORS.info
                        : activeTab === 'current-pursuits' ? HBC_COLORS.warning
                        : HBC_COLORS.success
                    }`,
                  }}
                >
                  {activeTab === 'estimate-log' && <DocumentBulletList24Regular />}
                  {activeTab === 'current-pursuits' && <TargetArrow24Regular />}
                  {activeTab === 'current-precon' && <BuildingFactory24Regular />}
                  {activeTab === 'estimate-log' ? 'Estimate Tracking Log'
                    : activeTab === 'current-pursuits' ? 'Current Pursuits'
                    : 'Current Preconstruction'}
                </div>

                {/* Field card — elevated with alternating rows */}
                <div className={styles.spotlightFieldCard}>
                  <div className={styles.spotlightFieldGrid}>
                    {/* Project # — READ-ONLY (locked per Stage 18 Sub-task 3 rule) */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Project #</span>
                      <span>{liveMeetingProject.ProjectCode || '—'}</span>
                    </div>
                    {/* Title */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Project Name</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="Title" value={liveMeetingProject.Title ?? ''} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Lead Estimator */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Lead Estimator</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="LeadEstimator" value={liveMeetingProject.LeadEstimator ?? ''} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* PX */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>PX</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="PX_ProjectExecutive" value={liveMeetingProject.PX_ProjectExecutive ?? ''} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Award Status */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Award Status</span>
                      <EditableSelectCell rowId={liveMeetingProject.id} field="AwardStatus" value={liveMeetingProject.AwardStatus ?? ''} options={AWARD_STATUS_OPTIONS} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Source */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Source</span>
                      <EditableSelectCell rowId={liveMeetingProject.id} field="Source" value={liveMeetingProject.Source ?? ''} options={ESTIMATE_SOURCE_OPTIONS} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Deliverable Type */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Deliverable Type</span>
                      <EditableSelectCell rowId={liveMeetingProject.id} field="DeliverableType" value={liveMeetingProject.DeliverableType ?? ''} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Estimate Type */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Estimate Type</span>
                      <EditableSelectCell rowId={liveMeetingProject.id} field="EstimateType" value={liveMeetingProject.EstimateType ?? ''} options={DELIVERABLE_OPTIONS} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Cost per GSF */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Cost per GSF</span>
                      <EditableNumberCell rowId={liveMeetingProject.id} field="CostPerGSF" numValue={liveMeetingProject.CostPerGSF} isCurrency onSave={handleInlineEdit} cellClassName={styles.editableCell} currencyClassName={styles.currencyText} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Cost per Unit */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Cost per Unit</span>
                      <EditableNumberCell rowId={liveMeetingProject.id} field="CostPerUnit" numValue={liveMeetingProject.CostPerUnit} isCurrency onSave={handleInlineEdit} cellClassName={styles.editableCell} currencyClassName={styles.currencyText} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Precon Budget */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Precon Budget</span>
                      <EditableNumberCell rowId={liveMeetingProject.id} field="PreconFee" numValue={liveMeetingProject.PreconFee} isCurrency onSave={handleInlineEdit} cellClassName={styles.editableCell} currencyClassName={styles.currencyText} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Design Budget */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Design Budget</span>
                      <EditableNumberCell rowId={liveMeetingProject.id} field="DesignBudget" numValue={liveMeetingProject.DesignBudget} isCurrency onSave={handleInlineEdit} cellClassName={styles.editableCell} currencyClassName={styles.currencyText} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Billed to Date */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Billed to Date</span>
                      <EditableNumberCell rowId={liveMeetingProject.id} field="FeePaidToDate" numValue={liveMeetingProject.FeePaidToDate} isCurrency onSave={handleInlineEdit} cellClassName={styles.editableCell} currencyClassName={styles.currencyText} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Due Date */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Due Date</span>
                      <EditableDateCell rowId={liveMeetingProject.id} field="DueDate_OutTheDoor" isoValue={liveMeetingProject.DueDate_OutTheDoor} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Sub Bids Due */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Sub Bids Due</span>
                      <EditableDateCell rowId={liveMeetingProject.id} field="SubBidsDue" isoValue={liveMeetingProject.SubBidsDue} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Submitted Date */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Submitted</span>
                      <EditableDateCell rowId={liveMeetingProject.id} field="SubmittedDate" isoValue={liveMeetingProject.SubmittedDate} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Contributors */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Contributors</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="Contributors" value={(liveMeetingProject.Contributors ?? []).join(', ')} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Doc Set Stage */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Current Stage</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="DocSetStage" value={liveMeetingProject.DocSetStage ?? ''} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Notes/Feedback */}
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Notes</span>
                      <EditableTextCell rowId={liveMeetingProject.id} field="NotesFeedback" value={liveMeetingProject.NotesFeedback ?? ''} onSave={handleInlineEdit} cellClassName={styles.editableCell} inputClassName={styles.inlineInput} />
                    </div>
                    {/* Checkboxes */}
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Bid Bond</span>
                      <EditableCheckboxCell rowId={liveMeetingProject.id} field="Chk_BidBond" checked={Boolean(liveMeetingProject.Chk_BidBond)} onSave={handleInlineEdit} wrapperClassName={styles.inlineCheckbox} />
                    </div>
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>P&P Bond</span>
                      <EditableCheckboxCell rowId={liveMeetingProject.id} field="Chk_PPBond" checked={Boolean(liveMeetingProject.Chk_PPBond)} onSave={handleInlineEdit} wrapperClassName={styles.inlineCheckbox} />
                    </div>
                    <div className={mergeClasses(styles.spotlightFieldRow, styles.spotlightFieldRowAlt)}>
                      <span className={styles.spotlightFieldLabel}>Schedule</span>
                      <EditableCheckboxCell rowId={liveMeetingProject.id} field="Chk_Schedule" checked={Boolean(liveMeetingProject.Chk_Schedule)} onSave={handleInlineEdit} wrapperClassName={styles.inlineCheckbox} />
                    </div>
                    <div className={styles.spotlightFieldRow}>
                      <span className={styles.spotlightFieldLabel}>Logistics</span>
                      <EditableCheckboxCell rowId={liveMeetingProject.id} field="Chk_Logistics" checked={Boolean(liveMeetingProject.Chk_Logistics)} onSave={handleInlineEdit} wrapperClassName={styles.inlineCheckbox} />
                    </div>
                  </div>
                </div>

                {/* Meeting Notes — threaded comment system */}
                <MeetingNotesThread
                  rowId={liveMeetingProject.id}
                  notes={(liveMeetingProject.MeetingNotes as Array<{ timestamp: string; user: string; text: string }>) ?? []}
                  currentUserName={currentUser?.displayName ?? 'Unknown'}
                  onSave={handleInlineEdit}
                  styles={{
                    panel: styles.spotlightPanel,
                    panelHeader: styles.spotlightPanelHeader,
                    notesList: styles.spotlightNotesList,
                    noteEntry: styles.spotlightNoteEntry,
                    noteTimestamp: styles.spotlightNoteTimestamp,
                    noteUser: styles.spotlightNoteUser,
                    noteText: styles.spotlightNoteText,
                    noteInput: styles.spotlightNoteInput,
                  }}
                />

                {/* Action Items — elevated panel with blur-to-save textarea */}
                <div className={styles.spotlightPanel}>
                  <div className={styles.spotlightPanelHeader}>
                    <DocumentBulletList24Regular />
                    Action Items
                  </div>
                  <MeetingTextarea
                    rowId={liveMeetingProject.id}
                    field="ActionItems"
                    value={liveMeetingProject.ActionItems ?? ''}
                    placeholder="Enter action items..."
                    rows={3}
                    onSave={handleInlineEdit}
                  />
                </div>
              </div>
            </div>

            {/* Spotlight footer — navigation, timer, mark reviewed (Stage 18 Sub-task 7: ARIA + permissions) */}
            <div className={styles.spotlightFooter}>
              <div className={styles.spotlightNavGroup} role="navigation" aria-label="Meeting project navigation">
                <Button size="medium" icon={<ArrowLeft24Regular />} disabled={clampedMeetingIndex <= 0} onClick={handleMeetingPrev} aria-label="Previous project">
                  Previous
                </Button>
                <Button size="medium" icon={<ArrowRight24Regular />} iconPosition="after" disabled={clampedMeetingIndex >= meetingTotal - 1} onClick={handleMeetingNext} aria-label="Next project">
                  Next
                </Button>
                <Button
                  size="medium"
                  appearance="primary"
                  icon={<Checkmark24Regular />}
                  onClick={handleMarkReviewed}
                  disabled={liveMeetingProject.MeetingReviewed === true || !canEditEstimating}
                  aria-label={liveMeetingProject.MeetingReviewed ? 'Project already reviewed' : 'Mark project as reviewed'}
                >
                  {liveMeetingProject.MeetingReviewed ? 'Reviewed' : 'Mark Reviewed'}
                </Button>
              </div>
              <div className={styles.spotlightTimerGroup}>
                <Checkbox
                  label="Auto-advance"
                  checked={meetingAutoAdvance}
                  onChange={(_, d) => setMeetingAutoAdvance(Boolean(d.checked))}
                  aria-label="Auto-advance to next project when timer expires"
                />
                <Button
                  size="medium"
                  appearance="subtle"
                  icon={<Timer24Regular />}
                  onClick={() => setMeetingTimerRunning((r) => !r)}
                  aria-label={meetingTimerRunning ? 'Pause meeting timer' : 'Start meeting timer'}
                  aria-pressed={meetingTimerRunning}
                >
                  {meetingTimerRunning ? 'Pause' : 'Timer'}
                </Button>
                <span className={styles.timerDisplay} role="timer" aria-live="off" aria-label="Meeting timer">
                  {`${Math.floor(meetingTimerSeconds / 60)}:${String(meetingTimerSeconds % 60).padStart(2, '0')}`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal mode — KPI grid, tabs, toolbar, table (all existing behavior preserved) */
          <>
            {/* Stage 18 Sub-task 7: ARIA live region for KPI dynamic content */}
            <div className={styles.kpiGrid} role="region" aria-label="Key performance indicators">
              {trackingKpis.map((kpi) => (
                <Card key={kpi.key} className={styles.kpiCard} size="small">
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>{kpi.label}</span>
                    <Badge appearance="tint" color="brand">{tabLabel}</Badge>
                  </div>
                  <div className={styles.kpiValue}>{kpi.value}</div>
                  <div className={styles.kpiSubtitle}>{kpi.subtitle}</div>
                </Card>
              ))}
            </div>

            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => startUITransition(() => setActiveTab(data.value as TabValue))}
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
                <div className={styles.toolbarRight}>
                  <span className={styles.rowCount}>
                    {filteredItems.length} of {activeItems.length} row(s)
                  </span>
                  {/* Stage 18 Sub-task 7: ARIA labels + ESTIMATING_READ/EDIT permission gates on all toolbar actions */}
                  <div className={styles.toolbarActions}>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={isTableFullscreen ? <ArrowMinimize24Regular /> : <ArrowMaximize24Regular />}
                      onClick={() => { void handleToggleFullscreen(); }}
                      aria-label={isTableFullscreen ? 'Exit fullscreen view' : 'Enter fullscreen view'}
                    >
                      {isTableFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </Button>
                    <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleExportCsv} disabled={!canReadEstimating} aria-label="Export current view as CSV">CSV</Button>
                    <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={() => { void handleExportExcel(); }} disabled={!canReadEstimating} aria-label="Export current view as Excel">Excel</Button>
                    <Button size="small" appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleExportPdf} disabled={!canReadEstimating} aria-label="Export current view as PDF">PDF</Button>
                    {/* Stage 18 Sub-task 6b + 7: Meeting Mode toggle gated behind ESTIMATING_EDIT */}
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<SlideText24Regular />}
                      className={styles.meetingToolbarBtn}
                      disabled={filteredItems.length === 0 || !canEditEstimating}
                      onClick={handleEnterMeetingMode}
                      aria-label="Enter meeting review mode"
                    >
                      Meeting Mode
                    </Button>
                  </div>
                </div>
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
                <>
                  {activeTab === 'estimate-log' && (
                    <HbcDataTable
                      tableId="department-tracking-estimate-log"
                      ariaLabel="Department tracking - estimate log"
                      keyExtractor={(item) => item.id}
                      items={filteredItems}
                      columns={estimateLogColumns}
                      sortField={sortByByTab['estimate-log']?.field}
                      sortAsc={sortByByTab['estimate-log']?.asc}
                      onSort={(field) => handleSortChange('estimate-log', field)}
                      enableFiltering
                      enableGrouping
                      groupBy={groupByByTab['estimate-log']}
                      onGroupByChange={(next) => setGroupByByTab((previous) => ({ ...previous, 'estimate-log': next }))}
                      enableColumnVisibility
                      columnVisibility={columnVisibilityByTab['estimate-log']}
                      onColumnVisibilityChange={(next) => setColumnVisibilityByTab((previous) => ({ ...previous, 'estimate-log': next }))}
                      enableInlineEditing
                      virtualization={{ enabled: true, threshold: 100 }}
                      enableBuiltInToolbar={false}
                      enableBuiltInFooter={false}
                    />
                  )}
                  {activeTab === 'current-pursuits' && (
                    <HbcDataTable
                      tableId="department-tracking-current-pursuits"
                      ariaLabel="Department tracking - current pursuits"
                      keyExtractor={(item) => item.id}
                      items={filteredItems}
                      columns={currentPursuitsColumns}
                      sortField={sortByByTab['current-pursuits']?.field}
                      sortAsc={sortByByTab['current-pursuits']?.asc}
                      onSort={(field) => handleSortChange('current-pursuits', field)}
                      enableFiltering
                      enableGrouping
                      groupBy={groupByByTab['current-pursuits']}
                      onGroupByChange={(next) => setGroupByByTab((previous) => ({ ...previous, 'current-pursuits': next }))}
                      enableColumnVisibility
                      columnVisibility={columnVisibilityByTab['current-pursuits']}
                      onColumnVisibilityChange={(next) => setColumnVisibilityByTab((previous) => ({ ...previous, 'current-pursuits': next }))}
                      enableInlineEditing
                      virtualization={{ enabled: true, threshold: 100 }}
                      enableBuiltInToolbar={false}
                      enableBuiltInFooter={false}
                    />
                  )}
                  {activeTab === 'current-precon' && (
                    <HbcDataTable
                      tableId="department-tracking-current-precon"
                      ariaLabel="Department tracking - current preconstruction"
                      keyExtractor={(item) => item.id}
                      items={filteredItems}
                      columns={currentPreconColumns}
                      sortField={sortByByTab['current-precon']?.field}
                      sortAsc={sortByByTab['current-precon']?.asc}
                      onSort={(field) => handleSortChange('current-precon', field)}
                      enableFiltering
                      enableGrouping
                      groupBy={groupByByTab['current-precon']}
                      onGroupByChange={(next) => setGroupByByTab((previous) => ({ ...previous, 'current-precon': next }))}
                      enableColumnVisibility
                      columnVisibility={columnVisibilityByTab['current-precon']}
                      onColumnVisibilityChange={(next) => setColumnVisibilityByTab((previous) => ({ ...previous, 'current-precon': next }))}
                      enableInlineEditing
                      virtualization={{ enabled: true, threshold: 100 }}
                      enableBuiltInToolbar={false}
                      enableBuiltInFooter={false}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Slide-out drawer for new entries ── */}
      <SlideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={drawerTitle}
        width={480}
      >
        {/* Stage 18 Sub-task 4 Refinement: editable project-details drawer (read-only default, edit toggle) */}
        {drawerMode === 'project-details' && selectedProjectRow ? (
          <div className={styles.drawerDetails}>
            {/* Edit toolbar — only visible to roles with edit access */}
            <RoleGate allowedRoles={EDIT_ROLES}>
              <div className={styles.drawerEditToolbar}>
                {isDrawerEditing ? (
                  <Button size="small" appearance="subtle" onClick={() => setIsDrawerEditing(false)}>
                    Done Editing
                  </Button>
                ) : (
                  <Button size="small" appearance="primary" onClick={() => setIsDrawerEditing(true)}>
                    Edit Details
                  </Button>
                )}
              </div>
            </RoleGate>

            {/* ProjectCode — always read-only (locked per validateInlineField) */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Project #</span>
              <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).ProjectCode || '—'}</span>
            </div>
            {/* Title — always read-only (locked per validateInlineField) */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Project Name</span>
              <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).Title || '—'}</span>
            </div>

            {/* LeadEstimator */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Lead Estimator</span>
              {isDrawerEditing ? (
                <EditableTextCell
                  rowId={selectedProjectRow.id}
                  field="LeadEstimator"
                  value={(liveProjectRow ?? selectedProjectRow).LeadEstimator ?? ''}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).LeadEstimator || '—'}</span>
              )}
            </div>

            {/* AwardStatus */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Award Status</span>
              {isDrawerEditing ? (
                <EditableSelectCell
                  rowId={selectedProjectRow.id}
                  field="AwardStatus"
                  value={(liveProjectRow ?? selectedProjectRow).AwardStatus ?? ''}
                  options={AWARD_STATUS_OPTIONS}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).AwardStatus || '—'}</span>
              )}
            </div>

            {/* Source */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Source</span>
              {isDrawerEditing ? (
                <EditableSelectCell
                  rowId={selectedProjectRow.id}
                  field="Source"
                  value={(liveProjectRow ?? selectedProjectRow).Source ?? ''}
                  options={ESTIMATE_SOURCE_OPTIONS}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).Source || '—'}</span>
              )}
            </div>

            {/* DeliverableType */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Deliverable Type</span>
              {isDrawerEditing ? (
                <EditableSelectCell
                  rowId={selectedProjectRow.id}
                  field="DeliverableType"
                  value={(liveProjectRow ?? selectedProjectRow).DeliverableType ?? ''}
                  options={DELIVERABLE_OPTIONS}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).DeliverableType || '—'}</span>
              )}
            </div>

            {/* EstimateType */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Estimate Type</span>
              {isDrawerEditing ? (
                <EditableSelectCell
                  rowId={selectedProjectRow.id}
                  field="EstimateType"
                  value={(liveProjectRow ?? selectedProjectRow).EstimateType ?? ''}
                  options={DELIVERABLE_OPTIONS}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).EstimateType || '—'}</span>
              )}
            </div>

            {/* PreconFee (currency) */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Precon Budget</span>
              {isDrawerEditing ? (
                <EditableNumberCell
                  rowId={selectedProjectRow.id}
                  field="PreconFee"
                  numValue={(liveProjectRow ?? selectedProjectRow).PreconFee}
                  isCurrency
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  currencyClassName={styles.currencyText}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{formatCurrency((liveProjectRow ?? selectedProjectRow).PreconFee)}</span>
              )}
            </div>

            {/* DesignBudget (currency) */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Design Budget</span>
              {isDrawerEditing ? (
                <EditableNumberCell
                  rowId={selectedProjectRow.id}
                  field="DesignBudget"
                  numValue={(liveProjectRow ?? selectedProjectRow).DesignBudget}
                  isCurrency
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  currencyClassName={styles.currencyText}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{formatCurrency((liveProjectRow ?? selectedProjectRow).DesignBudget)}</span>
              )}
            </div>

            {/* FeePaidToDate (currency) */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Billed to Date</span>
              {isDrawerEditing ? (
                <EditableNumberCell
                  rowId={selectedProjectRow.id}
                  field="FeePaidToDate"
                  numValue={(liveProjectRow ?? selectedProjectRow).FeePaidToDate}
                  isCurrency
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  currencyClassName={styles.currencyText}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{formatCurrency((liveProjectRow ?? selectedProjectRow).FeePaidToDate)}</span>
              )}
            </div>

            {/* DueDate_OutTheDoor */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Due Date (Out the Door)</span>
              {isDrawerEditing ? (
                <EditableDateCell
                  rowId={selectedProjectRow.id}
                  field="DueDate_OutTheDoor"
                  isoValue={(liveProjectRow ?? selectedProjectRow).DueDate_OutTheDoor}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).DueDate_OutTheDoor || '—'}</span>
              )}
            </div>

            {/* Contributors */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Contributors</span>
              {isDrawerEditing ? (
                <EditableTextCell
                  rowId={selectedProjectRow.id}
                  field="Contributors"
                  value={((liveProjectRow ?? selectedProjectRow).Contributors ?? []).join(', ')}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>
                  {((liveProjectRow ?? selectedProjectRow).Contributors ?? []).length > 0
                    ? (liveProjectRow ?? selectedProjectRow).Contributors?.join(', ')
                    : '—'}
                </span>
              )}
            </div>

            {/* NotesFeedback */}
            <div className={styles.drawerDetailRow}>
              <span className={styles.drawerDetailLabel}>Notes</span>
              {isDrawerEditing ? (
                <EditableTextCell
                  rowId={selectedProjectRow.id}
                  field="NotesFeedback"
                  value={(liveProjectRow ?? selectedProjectRow).NotesFeedback ?? ''}
                  onSave={handleInlineEdit}
                  cellClassName={styles.editableCell}
                  inputClassName=""
                />
              ) : (
                <span className={styles.drawerDetailValue}>{(liveProjectRow ?? selectedProjectRow).NotesFeedback || '—'}</span>
              )}
            </div>

            {/* Drawer footer actions */}
            <div className={styles.drawerActions}>
              {isDrawerEditing && (
                <Button size="small" appearance="subtle" onClick={() => setIsDrawerEditing(false)}>
                  Done Editing
                </Button>
              )}
              <Button size="small" onClick={closeDrawer}>Close</Button>
            </div>
          </div>
        ) : (
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
            <HbcButton onClick={closeDrawer}>Cancel</HbcButton>
            <HbcButton
              emphasis="strong"
              disabled={!form.Title || !form.ProjectCode}
              onClick={() => void handleNewEntry()}
            >
              Create Entry
            </HbcButton>
          </div>
        </div>
        )}
      </SlideDrawer>
    </div>
  );
};
