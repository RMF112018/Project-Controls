/**
 * PHProjectTurnoverPage — Estimating-to-Operations Turnover Meeting
 *
 * Stage 19 Sub-task 1: Hybrid meeting-packet / live-collaboration page implementing
 * the HBC "Estimating and Project Manager Turnover Meeting Procedure" SOP.
 *
 * TODO (Stage 19 – Sub-task 15): Update this header to reference full plan (including Sub-task 15
 * deep-bid population). Add import for `IDeepBidPackage` and `DeepBidImportEnabled` flag from
 * `@hbc/sp-services`. Reference the provided local source and plan deliverable for Turnover
 * agenda population.
 *
 * Reference: reference/EstTurnover/Turnover Agenda.docx
 * User & admin guide: docs/turnover-meeting-guide.md
 *
 * Architecture:
 * - Default: read-only meeting packet containing all 18 SOP sections
 * - Edit Mode: role-gated collaborative editing with optimistic TanStack Query mutations
 * - Presentation Mode: two-column layout (agenda + content) for conference-room projection
 * - Threaded Comments: global + per-section discussion with @role mentions
 * - Sign-off: 4-signature block (Lead Estimator, PE, PM, Superintendent) triggers handoff
 *
 * Single-screen conference-room presentation requirement:
 * When projected on a shared screen, Presentation Mode shows a minimal left agenda
 * (20-25%) and large right content (75-80%) with Prev/Next for meeting facilitation.
 */
import * as React from 'react';
import {
  Badge,
  Button,
  Checkbox,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  Input,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Switch,
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
  createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
  CheckmarkCircle24Regular,
  ChevronDown24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ChevronUp24Regular,
  Dismiss24Regular,
  DocumentAdd24Regular,
  DocumentBulletList24Regular,
  NoteEdit24Regular,
  PeopleTeam24Regular,
  Send24Regular,
  SlideText24Regular,
  TextBold20Regular,
  TextBulletList20Regular,
  TextItalic20Regular,
  TextNumberListLtr20Regular,
  TextUnderline20Regular,
  Link20Regular,
  Attach20Regular,
  WindowNew24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useToast } from '../../shared/ToastContainer';
import { RoleGate } from '../../guards/RoleGate';
import { useAppContext } from '../../contexts/AppContext';
import { ELEVATION, HBC_COLORS, TOUCH_TARGET, TRANSITION } from '../../../theme/tokens';
import {
  AuditAction,
  EntityType,
  ExportService,
  PERMISSIONS,
  RoleName,
  TurnoverStatus,
  formatCurrency,
} from '@hbc/sp-services';
import type {
  ITurnoverAgenda,
  ITurnoverPrerequisite,
  ITurnoverDiscussionItem,
  ITurnoverSubcontractor,
  ITurnoverExhibit,
  ITurnoverSignature,
  ITurnoverEstimateOverview,
  IProjectHandoffPayload,
} from '@hbc/sp-services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useProjectHubNavigate } from '../../project-hub/useProjectHubNavigate';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { qk } from '../../../tanstack/query/queryKeys';

// ── SOP Sections ──────────────────────────────────────────────────────
// Verbatim from reference/EstTurnover/Turnover Agenda.docx
// "Estimating and Project Manager Turnover Meeting Procedure (Confidential – Internal Use Only)"

/** SOP Purpose Statement — rendered verbatim in the Purpose section */
const SOP_PURPOSE_TEXT =
  'To ensure a smooth and efficient transition of a construction project from the estimating ' +
  'phase to the project management and field operations team. This meeting facilitates the ' +
  'transfer of vital project information, setting the stage for successful project execution.';

/** SOP Affidavit — rendered verbatim in the Summary & Sign-off section */
const SOP_AFFIDAVIT_TEXT =
  'The undersigned hereby acknowledges having reviewed and accepted the foregoing items.';

/** SOP section groups with sidebar headings — maps each section to its ITurnoverAgenda backing field */
interface ISOPSection {
  id: string;
  label: string;
  group: string;
  model: 'header' | 'signatures' | 'prerequisites' | 'static' | 'discussionItems' | 'estimateOverview' | 'subcontractors' | 'exhibits';
}

const TURNOVER_SOP_SECTIONS: ISOPSection[] = [
  // ── Project Overview ─────────────────────────────────────────────
  // SOP: Job Number, Project Name, Address, Owner, Owner's Rep, Contract Status, Permit Status, Anticipated Start Date
  { id: 'project-info',      label: 'Project Information',                          group: 'Project Overview',          model: 'header' },
  // SOP: Required Attendees (PE, PM, APM, Superintendent, Lead Estimator) + Optional (VP of Operations, Chief Estimator)
  { id: 'attendees',         label: 'Meeting Attendees',                            group: 'Project Overview',          model: 'signatures' },
  // SOP: PM/Superintendent familiarize with plans & specs, site visit, Lead Estimator prepares agenda, Est. Coordinator prints documents
  { id: 'prerequisites',     label: 'Pre-Meeting Prerequisites',                    group: 'Project Overview',          model: 'prerequisites' },
  // SOP: Static purpose statement
  { id: 'purpose',           label: 'Purpose',                                      group: 'Project Overview',          model: 'static' },
  // SOP: Project Description
  { id: 'general-info',      label: 'General Project Information',                  group: 'Project Overview',          model: 'discussionItems' },

  // ── Turnover to Operations ───────────────────────────────────────
  // SOP: Review drawings and bid documents, plan flip, specs, RFIs, addendums
  { id: 'drawings-review',   label: 'Turnover to Operations',                       group: 'Turnover to Operations',    model: 'discussionItems' },
  // SOP: Contract Value, Duration, Total GC, Total GR, Site Maintenance, Contingency, Profit Margin, Buyout, Procore
  { id: 'estimate-overview', label: 'Project Estimate Overview',                    group: 'Turnover to Operations',    model: 'estimateOverview' },

  // ── Risk & Value Analysis ────────────────────────────────────────
  // SOP: Identify risks of the project and risk mitigation strategies
  { id: 'risks',             label: 'Risk Identification & Mitigation',             group: 'Risk & Value Analysis',     model: 'discussionItems' },
  // SOP: VE options, SDI program gaps, scope clarifications
  { id: 'savings-shortfalls', label: 'Potential Savings or Shortfalls',             group: 'Risk & Value Analysis',     model: 'discussionItems' },
  // SOP: HVAC, switchgear, light fixtures, windows/storefronts
  { id: 'lead-times',        label: 'Critical Lead Times',                          group: 'Risk & Value Analysis',     model: 'discussionItems' },

  // ── Subcontractor Review ─────────────────────────────────────────
  // SOP: Review Subcontractor Proposals and Bid Leveling Sheets
  { id: 'sub-proposals',     label: 'Subcontractor Proposals & Bid Leveling',       group: 'Subcontractor Review',      model: 'discussionItems' },
  // SOP: Trade-by-trade (Sitework, Concrete, Steel, Millwork, Roofing, Stucco, Plumbing, HVAC, Drywall, Tile, Rubber Floor, Electrical)
  { id: 'buyouts',           label: 'Potential Buyouts',                             group: 'Subcontractor Review',      model: 'discussionItems' },
  // SOP: Appliances (CFCI/OFCI items), electrical/plumbing coordination
  { id: 'scope-gaps',        label: 'Scope Gaps',                                   group: 'Subcontractor Review',      model: 'discussionItems' },
  // SOP: Review SDI Policy and Subcontractor Prequalification Policy
  { id: 'sdi-policy',        label: 'SDI Policy & Subcontractor Prequalification',  group: 'Subcontractor Review',      model: 'discussionItems' },
  // SOP: List Preferred and/or Required Subcontractors — Trade, Subcontractor, Email, Phone, Compass (Q-Score)
  { id: 'preferred-subs',    label: 'Preferred & Required Subcontractors',           group: 'Subcontractor Review',      model: 'subcontractors' },

  // ── Documents & Closeout ─────────────────────────────────────────
  // SOP: Cost Summary, Clarifications & Assumptions, Alternates, Allowances, VA Log, Schedule, Site Logistics, Labor Rates, RFIs, Other
  { id: 'exhibits',          label: 'Contract Document Exhibits',                   group: 'Documents & Closeout',      model: 'exhibits' },
  // SOP: Publish key Operations team contacts on Building Connected
  { id: 'post-meeting',      label: 'Post-Meeting Actions',                         group: 'Documents & Closeout',      model: 'discussionItems' },
  // SOP: Lead Estimator, PE, PM, Superintendent — sign with date
  { id: 'summary-signoff',   label: 'Summary & Sign-off',                           group: 'Documents & Closeout',      model: 'signatures' },
];

const SECTION_GROUPS = [...new Set(TURNOVER_SOP_SECTIONS.map(s => s.group))];

// Stage 19: Role gate for "Start Turnover Meeting" / "Toggle Edit Mode" button.
// Per SOP: "Required Attendees: Project Executive, Project Manager, Assistant Project Manager, Superintendent, Lead Estimator"
// RoleName enum has no ProjectManager; user confirmed: gate to all three Ops manager roles.
const TURNOVER_EDIT_ROLES: RoleName[] = [
  RoleName.Administrator,
  RoleName.Leadership,
  RoleName.Estimator,
  RoleName.PreconstructionManager,
  RoleName.CommercialOperationsManager,
  RoleName.LuxuryResidentialManager,
  RoleName.ManagerOfOperationalExcellence,
];

/**
 * Stage 19 Sub-task 4: localStorage key for the floating discussion panel collapsed/expanded state.
 * Persists user preference across page navigations and browser sessions so construction teams
 * don't have to re-expand the discussion drawer each time they return to the turnover page.
 * See CHANGELOG.md — [2026-02-28] Stage 19 Sub-task 4 feat(turnover) Floating Collapsible Discussion Panel.
 */
const DISCUSSION_PANEL_STORAGE_KEY = 'hbc-turnover-discussion-panel-expanded';

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
    minHeight: '48px',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexShrink: 0,
  },
  toolbarCenter: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexGrow: 1,
    justifyContent: 'center',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  // Presentation mode: two-column layout for conference room projection
  presentationContainer: {
    display: 'grid',
    gridTemplateColumns: '22% 78%',
    ...shorthands.gap('16px'),
    height: 'calc(100vh - 100px)',
    ...shorthands.overflow('hidden'),
  },
  presentationAgenda: {
    ...shorthands.padding('16px'),
    backgroundColor: HBC_COLORS.navy,
    color: '#FFFFFF',
    ...shorthands.borderRadius('8px'),
    overflowY: 'auto',
  },
  presentationAgendaItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('4px'),
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    color: '#FFFFFFCC',
    ':hover': {
      backgroundColor: '#FFFFFF1A',
    },
  },
  presentationAgendaItemActive: {
    backgroundColor: '#FFFFFF26',
    color: '#FFFFFF',
    fontWeight: tokens.fontWeightSemibold,
  },
  presentationAgendaGroup: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightBold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#FFFFFF80',
    marginTop: '12px',
    marginBottom: '4px',
    ...shorthands.padding('0', '12px'),
  },
  presentationContent: {
    ...shorthands.padding('24px'),
    overflowY: 'auto',
  },
  // BD Client & Project Notes pinned banner
  bdBanner: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.navy),
    ...shorthands.borderRadius('0', '8px', '8px', '0'),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  // TODO (Stage 19 – Sub-task 15): Immediately after the `agendaQuery`, add a second TanStack Query `deepBidQuery` (key: qk.deepBid.byProject(scope, projectCode)) that fetches the project's deepBidPackage when present. Use `enabled: !!projectCode && DeepBidImportEnabled`. Merge into local `agenda` state via useMemo so estimateOverview, exhibits (Cost Summary), risks/lead-times/buyouts sections can prefer deep-bid values. Reference plan technical approach and existing useQueryScope pattern.
  bdBannerLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  bdBannerValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  // Section cards
  sectionCard: {
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  infoLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  infoValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  // Purpose callout
  purposeCallout: {
    ...shorthands.padding('20px', '24px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.orange),
    ...shorthands.borderRadius('0', '8px', '8px', '0'),
    fontSize: tokens.fontSizeBase300,
    lineHeight: '1.6',
    color: HBC_COLORS.navy,
    fontStyle: 'italic',
  },
  // Affidavit callout
  affidavitCallout: {
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.navy),
    ...shorthands.borderRadius('0', '8px', '8px', '0'),
    fontSize: tokens.fontSizeBase300,
    lineHeight: '1.6',
    color: HBC_COLORS.navy,
    marginBottom: '16px',
  },
  // Signature row
  signatureRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.gap('12px'),
  },
  signatureInfo: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flexGrow: 1,
  },
  signatureRole: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  signatureName: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  signedBadge: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    color: HBC_COLORS.success,
    fontSize: tokens.fontSizeBase200,
  },
  // Thread panel
  threadPanel: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.navy),
  },
  // TODO (Stage 19 – Sub-task 15): In the sign-off useEffect (handoffMutation payload construction), include the full `deepBidPackage` (or turnoverAgendaPopulation subset) from the merged agenda state. Update the handoff to Operations to carry complete normalized data. Reference provided source lines 370–410 and Sub-task 9 handoff extension.
  threadHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    marginBottom: '12px',
    fontSize: tokens.fontSizeBase300,
  },
  threadList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '12px',
  },
  threadEntry: {
    ...shorthands.padding('8px', '12px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('6px'),
  },
  threadMeta: {
    display: 'flex',
    ...shorthands.gap('8px'),
    marginBottom: '4px',
  },
  threadTimestamp: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
  },
  threadUser: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  threadText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.4',
  },
  threadInput: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'flex-end',
  },
  // Prerequisite checklist item
  prereqItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  prereqContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flexGrow: 1,
  },
  prereqLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  prereqLabelDone: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground4,
    textDecorationLine: 'line-through',
  },
  prereqDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  prereqBadge: {
    fontSize: tokens.fontSizeBase100,
    color: HBC_COLORS.success,
  },
  // Estimate overview table
  estimateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('10px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ':nth-child(even)': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  estimateLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  estimateValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontFamily: 'monospace',
  },
  // Discussion item
  discussionItem: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  discussionLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    marginBottom: '4px',
  },
  discussionNotes: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  // Handoff success
  handoffSuccess: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('32px'),
    textAlign: 'center',
  },
  handoffTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: HBC_COLORS.success,
  },
  handoffMessage: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    maxWidth: '500px',
  },
  // Exhibit item
  exhibitItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('10px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  exhibitLabel: {
    fontSize: tokens.fontSizeBase300,
    color: HBC_COLORS.navy,
  },
  // ── Rich Text Field styles ──────────────────────────────────────────
  // Full-width rich text editor replacing plain Textarea components.
  // Accessibility: :focus-within brand stroke, 4.5:1 contrast, smooth 200ms transitions.
  richTextContainer: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('6px'),
    ...shorthands.overflow('hidden'),
    transitionProperty: 'border-color',
    transitionDuration: '200ms',
    ':focus-within': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  richTextToolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('2px'),
    ...shorthands.padding('4px', '8px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  richTextToolbarDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: tokens.colorNeutralStroke2,
    ...shorthands.margin('0', '4px'),
  },
  richTextEditorWrapper: {
    position: 'relative',
  },
  richTextEditor: {
    minHeight: '120px',
    ...shorthands.padding('12px', '16px'),
    lineHeight: '1.6',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    outlineStyle: 'none',
    cursor: 'text',
    '& ul, & ol': {
      paddingLeft: '24px',
      ...shorthands.margin('4px', '0'),
    },
    '& a': {
      color: tokens.colorBrandForegroundLink,
      textDecorationLine: 'underline',
    },
    '& b, & strong': {
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  richTextPlaceholder: {
    position: 'absolute',
    top: '12px',
    left: '16px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    pointerEvents: 'none',
  },
  richTextReadOnly: {
    lineHeight: '1.6',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap',
    '& ul, & ol': {
      paddingLeft: '24px',
      ...shorthands.margin('4px', '0'),
    },
    '& a': {
      color: tokens.colorBrandForegroundLink,
      textDecorationLine: 'underline',
    },
    '& b, & strong': {
      fontWeight: tokens.fontWeightSemibold,
    },
  },

  // ── Stage 19 Sub-task 4: Floating Collapsible Discussion Panel ──────
  // Converts the global Discussion thread from an inline page element to a persistent
  // floating bottom-sheet (chat drawer) that stays visible while scrolling through
  // the 18 SOP sections. Always active in both packet (read-only) and edit modes.
  // See CHANGELOG.md — [2026-02-28] Stage 19 Sub-task 4 feat(turnover).
  //
  // Design decisions:
  // - Transform-based animation (GPU-composited, no layout reflow)
  // - Z-index 1050: above navbar (999-1000), below HelpPanel (1100), below modals (10000)
  // - 44px min touch targets per WCAG 2.2 SC 2.5.8 AA (construction field use)
  // - prefers-reduced-motion: instant toggle, no animation
  // - Mobile responsive: full-width ≤768px, max-width 800px centered on desktop

  /** Fixed-bottom floating container for the global discussion thread */
  floatingPanelContainer: {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '800px',
    zIndex: 1050,
    boxShadow: ELEVATION.level3,
    ...shorthands.borderRadius('12px', '12px', '0', '0'),
    ...shorthands.overflow('hidden'),
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.normal,
    transitionTimingFunction: 'ease',
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0ms',
    },
    '@media (max-width: 768px)': {
      maxWidth: '100%',
      left: '0',
      right: '0',
      transform: 'none',
      ...shorthands.borderRadius('0'),
    },
  },

  // TODO (Stage 19 – Sub-task 15): In the 'estimate-overview' case (and any other relevant sections: risks, lead-times, buyouts, exhibits), prefer values from `agenda.deepBidPackage?.primaryEstimateSummary` and `primaryGCGRScenario` when available. Render attribution badge "Populated from Deep Bid Import – [originalFilename]" with raw-file download link (using existing ExportService pattern). Fall back to legacy agenda.estimateOverview for projects without deep-bid data. Gate behind feature flag. Ensure optimistic mutations still work. Reference provided source lines 620–680 and plan success criteria.

  /** Collapsed state — only the 48px header bar is visible */
  floatingPanelCollapsed: {
    transform: 'translateX(-50%) translateY(calc(100% - 48px))',
    '@media (max-width: 768px)': {
      transform: 'translateY(calc(100% - 48px))',
    },
  },

  /** Clickable header bar — navy background with 48px height for touch comfort */
  floatingPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '16px'),
    minHeight: TOUCH_TARGET.preferred,
    backgroundColor: HBC_COLORS.navy,
    color: '#FFFFFF',
    cursor: 'pointer',
    userSelect: 'none',
  },

  /** Left side of header: icon + title + optional badge */
  floatingPanelHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },

  /** Chevron toggle button — 44x44px touch target per WCAG */
  floatingPanelToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TOUCH_TARGET.min,
    minHeight: TOUCH_TARGET.min,
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    color: '#FFFFFF',
    cursor: 'pointer',
    ...shorthands.borderRadius('4px'),
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: '#FFFFFF',
      outlineOffset: '-2px',
    },
  },

  /** Scrollable body area containing the TurnoverThread */
  floatingPanelBody: {
    maxHeight: '360px',
    overflowY: 'auto',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
  },

  /** Orange pill badge showing unread/total message count */
  floatingPanelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '22px',
    height: '22px',
    ...shorthands.padding('0', '6px'),
    ...shorthands.borderRadius('11px'),
    backgroundColor: HBC_COLORS.orange,
    color: '#FFFFFF',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightBold,
  },

  /** Bottom padding offset on page content to avoid overlap with the collapsed panel header */
  pageContentWithPanel: {
    paddingBottom: '64px',
  },
});

// ── Helpers ───────────────────────────────────────────────────────────

function formatNoteTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatSignatureDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Subcontractor DataGrid columns ─────────────────────────────────
// SOP: Trade, Subcontractor, Email, Phone, Compass (Q-Score)
const subcontractorColumns: TableColumnDefinition<ITurnoverSubcontractor>[] = [
  createTableColumn<ITurnoverSubcontractor>({ columnId: 'trade', renderHeaderCell: () => 'Trade', renderCell: item => item.trade }),
  createTableColumn<ITurnoverSubcontractor>({ columnId: 'name', renderHeaderCell: () => 'Subcontractor', renderCell: item => item.subcontractorName }),
  createTableColumn<ITurnoverSubcontractor>({ columnId: 'contact', renderHeaderCell: () => 'Contact', renderCell: item => item.contactName }),
  createTableColumn<ITurnoverSubcontractor>({ columnId: 'email', renderHeaderCell: () => 'Email', renderCell: item => item.contactEmail }),
  createTableColumn<ITurnoverSubcontractor>({ columnId: 'phone', renderHeaderCell: () => 'Phone', renderCell: item => item.contactPhone }),
  createTableColumn<ITurnoverSubcontractor>({
    columnId: 'compass',
    renderHeaderCell: () => 'Compass',
    renderCell: item => item.qScore != null ? String(item.qScore) : '—',
  }),
  createTableColumn<ITurnoverSubcontractor>({
    columnId: 'preferred',
    renderHeaderCell: () => 'Preferred',
    renderCell: item => item.isPreferred ? 'Yes' : '—',
  }),
];

// ── RichTextField ─────────────────────────────────────────────────────
// Full-width rich text editor using contentEditable + document.execCommand().
// Replaces all plain Textarea fields with a professional formatting toolbar
// supporting Bold, Italic, Underline, Numbered/Bulleted lists, Hyperlinks,
// and File attachments. Zero new npm dependencies.
//
// UI/UX standards: visible focus ring, aria-labels on icon buttons,
// 4.5:1 contrast ratio, 200ms transitions, 1.6 line-height, 300ms debounce.

interface IRichTextFieldProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  onAttach?: (file: File) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const RichTextField: React.FC<IRichTextFieldProps> = React.memo(({
  value,
  onChange,
  placeholder = '',
  minHeight,
  onAttach,
  onKeyDown,
}) => {
  const styles = useStyles();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const [isEmpty, setIsEmpty] = React.useState(!value);

  // Sync external value to DOM only when they diverge (prevents cursor jumping)
  React.useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value;
      setIsEmpty(!value || value.replace(/<[^>]*>/g, '').trim().length === 0);
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 300ms debounced onChange — reduces mutation frequency vs per-keystroke firing
  const handleInput = React.useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const textOnly = html.replace(/<[^>]*>/g, '').trim();
    setIsEmpty(textOnly.length === 0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(html), 300);
  }, [onChange]);

  // Wrapper for document.execCommand — universally supported for simple formatting
  const execFormat = React.useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleLink = React.useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) execFormat('createLink', url);
  }, [execFormat]);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttach) onAttach(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onAttach]);

  return (
    <div className={styles.richTextContainer}>
      {/* Formatting toolbar — icon-only buttons with aria-labels for accessibility */}
      <div className={styles.richTextToolbar} role="toolbar" aria-label="Text formatting">
        <Button size="small" appearance="subtle" icon={<TextBold20Regular />}
          aria-label="Bold" onClick={() => execFormat('bold')} />
        <Button size="small" appearance="subtle" icon={<TextItalic20Regular />}
          aria-label="Italic" onClick={() => execFormat('italic')} />
        <Button size="small" appearance="subtle" icon={<TextUnderline20Regular />}
          aria-label="Underline" onClick={() => execFormat('underline')} />
        <div className={styles.richTextToolbarDivider} role="separator" />
        <Button size="small" appearance="subtle" icon={<TextBulletList20Regular />}
          aria-label="Bulleted list" onClick={() => execFormat('insertUnorderedList')} />
        <Button size="small" appearance="subtle" icon={<TextNumberListLtr20Regular />}
          aria-label="Numbered list" onClick={() => execFormat('insertOrderedList')} />
        <div className={styles.richTextToolbarDivider} role="separator" />
        <Button size="small" appearance="subtle" icon={<Link20Regular />}
          aria-label="Insert link" onClick={handleLink} />
        {onAttach && (
          <Button size="small" appearance="subtle" icon={<Attach20Regular />}
            aria-label="Attach file" onClick={() => fileInputRef.current?.click()} />
        )}
      </div>
      {/* Editor surface — contentEditable div with placeholder overlay */}
      <div className={styles.richTextEditorWrapper}>
        {isEmpty && !value && (
          <div className={styles.richTextPlaceholder}>{placeholder}</div>
        )}
        <div
          ref={editorRef}
          className={styles.richTextEditor}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
          style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
          onInput={handleInput}
          onKeyDown={onKeyDown}
          suppressContentEditableWarning
        />
      </div>
      {/* Hidden file input for attachment workflow */}
      {onAttach && (
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
    </div>
  );
});
RichTextField.displayName = 'RichTextField';

// ── MeetingNotesThread ──────────────────────────────────────────────
// Extended X/Twitter-style threaded discussion per SOP section or global.
// Pattern reused from DepartmentTrackingPage.tsx MeetingNotesThread.
interface ITurnoverNote {
  timestamp: string;
  user: string;
  text: string;
}

/**
 * Stage 19 Sub-task 4: isEditMode prop REMOVED from ITurnoverThreadProps.
 * Discussion threads are now always active — users can comment on any section
 * in both packet (read-only) and edit modes. This applies to the global floating
 * discussion panel AND all 18 per-section inline threads.
 * See CHANGELOG.md — [2026-02-28] Stage 19 Sub-task 4 feat(turnover).
 *
 * Prior Stage 19 context (Sub-tasks 1-3):
 * - Sub-task 1: Hybrid page mode (read-only packet + edit mode), Presentation Mode,
 *   threaded comments, sign-off flow, handoff mutation.
 * - Sub-task 2: On-demand agenda initialization with leadId auto-population.
 * - Sub-task 3: RichTextField for contentEditable rich text editing (Bold, Italic,
 *   Underline, lists, links, attachments) — replaced all Textarea instances.
 * - Pre-task 2: Cross-workspace routing fixes (projectCode search param fallback).
 */
interface ITurnoverThreadProps {
  sectionId: string;
  notes: ITurnoverNote[];
  currentUserName: string;
  onPost: (sectionId: string, text: string) => void;
}

const TurnoverThread: React.FC<ITurnoverThreadProps> = React.memo(({
  sectionId, notes, currentUserName, onPost,
}) => {
  const styles = useStyles();
  const [draft, setDraft] = React.useState('');
  const reversed = React.useMemo(() => (notes ?? []).slice().reverse(), [notes]);

  const handlePost = (): void => {
    // Strip HTML tags to check if content is truly empty
    const textOnly = draft.replace(/<[^>]*>/g, '').trim();
    if (!textOnly) return;
    onPost(sectionId, draft);
    setDraft('');
  };

  return (
    <div className={styles.threadPanel}>
      <div className={styles.threadHeader}>
        <NoteEdit24Regular />
        Discussion
      </div>
      {reversed.length > 0 && (
        <div className={styles.threadList}>
          {reversed.map((note, i) => (
            <div key={`${note.timestamp}-${i}`} className={styles.threadEntry}>
              <div className={styles.threadMeta}>
                <span className={styles.threadTimestamp}>{formatNoteTimestamp(note.timestamp)}</span>
                <span className={styles.threadUser}>{note.user}</span>
              </div>
              {/* Render stored HTML from rich text posts */}
              <div className={styles.richTextReadOnly} dangerouslySetInnerHTML={{ __html: note.text }} />
            </div>
          ))}
        </div>
      )}
      {/* Stage 19 Sub-task 4: Input always renders — no isEditMode gate.
        * Users can post discussion notes in both packet and edit modes. */}
      <div className={styles.threadInput}>
        <RichTextField
          value={draft}
          onChange={setDraft}
          placeholder="Add a note... (@Estimator, @PM, @Superintendent for mentions)"
          minHeight={60}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handlePost();
            }
          }}
          onAttach={(file) => {
            // TODO: Wire to attachment upload service when available
            // eslint-disable-next-line no-console
            console.log('[TurnoverThread] File attached:', file.name);
          }}
        />
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          disabled={!draft.replace(/<[^>]*>/g, '').trim()}
          onClick={handlePost}
        >
          Post
        </Button>
      </div>
    </div>
  );
});
TurnoverThread.displayName = 'TurnoverThread';

// ── Main Component ────────────────────────────────────────────────────

export const PHProjectTurnoverPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser, selectedProject, toggleFullScreen, exitFullScreen } = useAppContext();
  const { addToast } = useToast();
  // Stage 20: Use project-hub-aware navigate to preserve projectCode/leadId
  const navigate = useProjectHubNavigate();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const exportServiceRef = React.useRef(new ExportService());
  const [isPendingTransition, startTransition] = React.useTransition();

  // Search params — projectCode passed from DepartmentTrackingPage context menu
  const searchParams = useSearch({ strict: false }) as { projectCode?: string; leadId?: number };

  // ── State ──
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = React.useState(false);
  const [pipWindow, setPipWindow] = React.useState<Window | null>(null);
  const [handoffComplete, setHandoffComplete] = React.useState(false);

  // Threaded notes stored per-section in local state — persisted via discussion item mutations
  const [sectionNotes, setSectionNotes] = React.useState<Record<string, ITurnoverNote[]>>({
    global: [],
  });

  // ── Stage 19 Sub-task 4: Floating discussion panel state ──
  // Expanded/collapsed preference persists to localStorage so construction teams
  // don't have to re-expand the panel each time they return to the turnover page.
  const [isDiscussionPanelExpanded, setIsDiscussionPanelExpanded] = React.useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(DISCUSSION_PANEL_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true; // default: expanded
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(DISCUSSION_PANEL_STORAGE_KEY, String(isDiscussionPanelExpanded));
    } catch { /* SSR/iframe safety — localStorage may not be available */ }
  }, [isDiscussionPanelExpanded]);

  const projectCode = searchParams.projectCode || selectedProject?.projectCode || '';

  // ── Queries ──
  const agendaQuery = useQuery({
    queryKey: qk.turnover.byProject(scope, projectCode),
    queryFn: () => dataService.getTurnoverAgenda(projectCode),
    enabled: !!projectCode,
    staleTime: 30_000,
  });

  const agenda = agendaQuery.data;

  // ── Mutations (optimistic pattern from DepartmentTrackingPage) ──
  const updatePrerequisiteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ITurnoverPrerequisite> }) =>
      dataService.updateTurnoverPrerequisite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  const updateDiscussionItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ITurnoverDiscussionItem> }) =>
      dataService.updateTurnoverDiscussionItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  const updateSubcontractorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ITurnoverSubcontractor> }) =>
      dataService.updateTurnoverSubcontractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  const updateExhibitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ITurnoverExhibit> }) =>
      dataService.updateTurnoverExhibit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  const updateEstimateOverviewMutation = useMutation({
    mutationFn: (data: Partial<ITurnoverEstimateOverview>) =>
      dataService.updateTurnoverEstimateOverview(projectCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  const signMutation = useMutation({
    mutationFn: ({ signatureId, comment }: { signatureId: number; comment?: string }) =>
      dataService.signTurnoverAgenda(signatureId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    },
  });

  // Stage 19 Sub-task 2: On-demand turnover agenda initialization.
  // When no agenda exists for a project, the Estimator can create one directly
  // from this page. createTurnoverAgenda seeds the full SOP skeleton with
  // DEFAULT_PREREQUISITES, DEFAULT_DISCUSSION_ITEMS, DEFAULT_EXHIBITS, and
  // DEFAULT_SIGNATURES, plus auto-populates estimate overview from lead data.
  const createAgendaMutation = useMutation({
    mutationFn: ({ code, lead }: { code: string; lead: number }) =>
      dataService.createTurnoverAgenda(code, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
      setIsEditMode(true);
      addToast('Turnover agenda initialized. Edit mode enabled — populate the turnover package.', 'success', 5000);
    },
    onError: () => {
      addToast('Failed to initialize turnover agenda. Please try again.', 'error', 5000);
    },
  });

  const handoffMutation = useMutation({
    mutationFn: (payload: IProjectHandoffPayload) =>
      dataService.handoffProjectFromEstimating(payload),
    onSuccess: (result) => {
      if (result.success) {
        setHandoffComplete(true);
        addToast('Turnover complete! Project handed off to Operations.', 'success', 5000);
        // Generate PDF via ExportService
        exportServiceRef.current.exportToPDF('turnover-page-root', {
          filename: `Turnover-${projectCode}.pdf`,
          title: `Turnover Meeting — ${projectCode}`,
        });
      }
    },
    onError: () => {
      addToast('Handoff failed. Please try again.', 'error', 5000);
    },
  });

  // ── Section Navigation ──
  const activeSectionIndex = activeSectionId
    ? TURNOVER_SOP_SECTIONS.findIndex(s => s.id === activeSectionId)
    : -1;

  const handlePrevSection = React.useCallback(() => {
    const idx = activeSectionIndex <= 0 ? TURNOVER_SOP_SECTIONS.length - 1 : activeSectionIndex - 1;
    startTransition(() => setActiveSectionId(TURNOVER_SOP_SECTIONS[idx].id));
  }, [activeSectionIndex]);

  const handleNextSection = React.useCallback(() => {
    const idx = activeSectionIndex >= TURNOVER_SOP_SECTIONS.length - 1 ? 0 : activeSectionIndex + 1;
    startTransition(() => setActiveSectionId(TURNOVER_SOP_SECTIONS[idx].id));
  }, [activeSectionIndex]);

  const handleViewAllSections = React.useCallback(() => {
    startTransition(() => setActiveSectionId(null));
  }, []);

  // ── Thread handler ──
  const handlePostNote = React.useCallback((sectionId: string, text: string) => {
    const newNote: ITurnoverNote = {
      timestamp: new Date().toISOString(),
      user: currentUser?.displayName ?? 'Unknown',
      text,
    };
    setSectionNotes(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] ?? []), newNote],
    }));
  }, [currentUser?.displayName]);

  // ── Stage 19 Sub-task 4: Floating panel toggle + badge count ──
  const handleToggleDiscussionPanel = React.useCallback(() => {
    setIsDiscussionPanelExpanded(prev => !prev);
  }, []);

  const globalNoteCount = React.useMemo(
    () => (sectionNotes.global ?? []).length,
    [sectionNotes.global],
  );

  // ── Sign-off completion check ──
  React.useEffect(() => {
    if (!agenda || handoffComplete) return;
    const allSigned = agenda.signatures.length > 0 && agenda.signatures.every(s => s.signed);
    if (allSigned && !handoffMutation.isPending) {
      // Stage 19: Auto-trigger handoff when all required attendees have signed
      const payload: IProjectHandoffPayload = {
        projectCode,
        turnoverAgendaId: agenda.id,
        estimatingTrackerId: agenda.leadId,
        contractAmount: agenda.estimateOverview.contractAmount,
        originalEstimate: agenda.estimateOverview.originalEstimate,
        buyoutTarget: agenda.estimateOverview.buyoutTarget,
        estimatedFee: agenda.estimateOverview.estimatedFee,
        estimatedGrossMargin: agenda.estimateOverview.estimatedGrossMargin,
        contingency: agenda.estimateOverview.contingency,
        projectExecutive: agenda.header.projectExecutive,
        projectManager: agenda.header.projectManager,
        leadEstimator: agenda.header.leadEstimator,
        signatures: agenda.signatures.map(s => ({
          role: s.role,
          signerName: s.signerName,
          signerEmail: s.signerEmail,
          signedDate: s.signedDate ?? '',
        })),
        handoffDate: new Date().toISOString(),
        initiatedBy: currentUser?.displayName ?? 'System',
      };
      handoffMutation.mutate(payload);
    }
  }, [agenda, handoffComplete, handoffMutation, projectCode, currentUser?.displayName]);

  // ── Auto-initialization: create agenda on first load when leadId is available ──
  const hasAutoInitRef = React.useRef(false);
  React.useEffect(() => {
    const leadId = searchParams.leadId;
    if (
      !agendaQuery.isLoading &&
      !agenda &&
      leadId &&
      !createAgendaMutation.isPending &&
      !hasAutoInitRef.current
    ) {
      hasAutoInitRef.current = true;
      createAgendaMutation.mutate({ code: projectCode, lead: leadId });
    }
  }, [agendaQuery.isLoading, agenda, searchParams.leadId, createAgendaMutation, projectCode]);

  // ── Presentation Mode PiP ──
  const handlePopOutAgenda = React.useCallback(async () => {
    try {
      // Primary: Document Picture-in-Picture API
      if ('documentPictureInPicture' in window) {
        const pip = await (window as unknown as Record<string, { requestWindow: (opts: { width: number; height: number }) => Promise<Window> }>)
          .documentPictureInPicture.requestWindow({ width: 320, height: 600 });
        setPipWindow(pip);
        return;
      }
      // Fallback: window.open with BroadcastChannel
      const popup = window.open('', 'turnover-agenda-pip', 'width=320,height=600,left=0,top=0');
      if (popup) {
        setPipWindow(popup);
        const bc = new BroadcastChannel('hbc-turnover-pip');
        bc.onmessage = (event) => {
          if (event.data?.type === 'navigate' && event.data?.sectionId) {
            startTransition(() => setActiveSectionId(event.data.sectionId));
          }
        };
      }
    } catch {
      addToast('Pop-out agenda is not supported in this browser.', 'warning', 3000);
    }
  }, [addToast]);

  // ── Render: Empty / Loading states ──
  if (!selectedProject && !projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Project Turnover" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the Project Turnover meeting."
        />
      </div>
    );
  }

  if (agendaQuery.isLoading) {
    return (
      <div className={styles.root}>
        <PageHeader title="Project Turnover" subtitle="Loading..." />
      </div>
    );
  }

  if (!agenda) {
    // When leadId is available, the auto-init useEffect will trigger createAgendaMutation.
    // Show a loading state while that happens. When leadId is NOT available (direct URL
    // navigation), show a fallback message directing the user to DepartmentTrackingPage.
    // TODO (Stage 20+): Auto-populate agenda sections from existing Project Hub
    // and Estimating records (lead data, Go/No-Go scorecard, estimating kickoff,
    // bid log, subcontractor prequalification) to minimize manual data entry.
    if (createAgendaMutation.isPending || searchParams.leadId) {
      return (
        <div className={styles.root}>
          <PageHeader title="Project Turnover" subtitle={projectCode} />
          <HbcCard title="Initializing Turnover Package">
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <ProgressBar />
              <div style={{ marginTop: '16px', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                Setting up the 18-section SOP template...
              </div>
            </div>
          </HbcCard>
        </div>
      );
    }
    return (
      <div className={styles.root}>
        <PageHeader title="Project Turnover" subtitle={projectCode} />
        <HbcCard title="Initialize Turnover Package">
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <DocumentAdd24Regular style={{ fontSize: '48px', color: HBC_COLORS.navy, marginBottom: '16px' }} />
            <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
              No turnover agenda exists for this project yet.
            </div>
            <MessageBar intent="info">
              <MessageBarBody>
                Navigate from the Estimating Department Tracking page to initialize this turnover agenda.
                The tracking record provides the lead reference needed to seed project data.
              </MessageBarBody>
            </MessageBar>
          </div>
        </HbcCard>
      </div>
    );
  }

  // ── Render: Handoff Complete ──
  if (handoffComplete) {
    return (
      <div className={styles.root} id="turnover-page-root">
        <PageHeader title="Project Turnover" subtitle={`${projectCode} — ${agenda.projectName}`} />
        <div className={styles.handoffSuccess}>
          <CheckmarkCircle24Regular style={{ fontSize: '64px', color: HBC_COLORS.success }} />
          <div className={styles.handoffTitle}>Turnover Complete</div>
          <div className={styles.handoffMessage}>
            The Estimating-to-Operations turnover for {agenda.projectName} has been completed.
            All signatures have been recorded, and the project has been handed off to Operations.
            A PDF of the turnover packet has been generated.
          </div>
          <Button
            appearance="primary"
            size="large"
            onClick={() => navigate('/project-hub/dashboard', { search: { handoffFrom: 'turnover' } })}
          >
            Go to Project Hub
          </Button>
        </div>
      </div>
    );
  }

  // ── Computed values ──
  const currentSectionTitle = activeSectionId
    ? TURNOVER_SOP_SECTIONS.find(s => s.id === activeSectionId)?.label ?? 'All Sections'
    : 'All Sections';

  const prereqComplete = agenda.prerequisites.filter(p => p.completed).length;
  const prereqTotal = agenda.prerequisites.length;
  const signaturesComplete = agenda.signatures.filter(s => s.signed).length;
  const signaturesTotal = agenda.signatures.length;

  // Determine which sections to render
  const sectionsToRender = activeSectionId
    ? TURNOVER_SOP_SECTIONS.filter(s => s.id === activeSectionId)
    : TURNOVER_SOP_SECTIONS;

  // ── Stage 19 Sub-task 4: Floating Discussion Panel ──────────────────
  // Persistent bottom-sheet (chat drawer) for the global meeting discussion thread.
  // Renders in BOTH normal mode and Presentation Mode, always active regardless
  // of isEditMode. Collapsible via the navy header bar with localStorage persistence.
  //
  // Stage 19 context (prior sub-tasks that this builds upon):
  // - Sub-task 1: Hybrid page mode (read-only packet default, collaborative edit mode),
  //   Presentation Mode with Document PiP API, threaded comments system, sign-off flow.
  // - Sub-task 2: On-demand turnover agenda initialization from DepartmentTrackingPage
  //   with leadId search param auto-population.
  // - Sub-task 3: RichTextField contentEditable component replacing all Textarea instances,
  //   300ms debounced onChange, HTML-formatted posts with dangerouslySetInnerHTML rendering.
  // - Pre-task 2: Cross-workspace routing fixes — projectCode search param fallback in
  //   ProjectHubLayout, DepartmentTrackingPage context menu navigation.
  //
  // See CHANGELOG.md — [2026-02-28] Stage 19 Sub-task 4 feat(turnover).
  const floatingDiscussionPanel = (
    <div
      className={mergeClasses(
        styles.floatingPanelContainer,
        !isDiscussionPanelExpanded && styles.floatingPanelCollapsed,
      )}
      role="complementary"
      aria-label="Meeting discussion thread"
    >
      {/* Header bar — clickable to toggle expand/collapse */}
      <div
        className={styles.floatingPanelHeader}
        onClick={handleToggleDiscussionPanel}
        role="button"
        tabIndex={0}
        aria-expanded={isDiscussionPanelExpanded}
        aria-controls="turnover-floating-discussion-body"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleDiscussionPanel();
          }
        }}
      >
        <div className={styles.floatingPanelHeaderLeft}>
          <NoteEdit24Regular />
          <span>Meeting Discussion</span>
          {globalNoteCount > 0 && (
            <span className={styles.floatingPanelBadge} aria-label={`${globalNoteCount} messages`}>
              {globalNoteCount}
            </span>
          )}
        </div>
        <button
          className={styles.floatingPanelToggle}
          aria-label={isDiscussionPanelExpanded ? 'Collapse discussion panel' : 'Expand discussion panel'}
          tabIndex={-1}
        >
          {isDiscussionPanelExpanded ? <ChevronDown24Regular /> : <ChevronUp24Regular />}
        </button>
      </div>
      {/* Body — TurnoverThread with global notes, always-active input */}
      <div
        id="turnover-floating-discussion-body"
        className={styles.floatingPanelBody}
        role="region"
        aria-label="Discussion messages"
      >
        <TurnoverThread
          sectionId="global"
          notes={sectionNotes.global ?? []}
          currentUserName={currentUser?.displayName ?? 'Unknown'}
          onPost={handlePostNote}
        />
      </div>
    </div>
  );

  // ── Section render function ──
  const renderSection = (section: ISOPSection): React.ReactNode => {
    switch (section.id) {
      // ── 1. Project Information ──
      // SOP: Job Number, Project Name, Address, Owner, Owner's Rep, Contract Status, Permit Status, Anticipated Start Date
      case 'project-info':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Job Number</span>
              <span className={styles.infoValue}>{agenda.header.projectCode}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Project Name</span>
              <span className={styles.infoValue}>{agenda.header.projectName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Client</span>
              <span className={styles.infoValue}>{agenda.header.clientName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Project Value</span>
              <span className={styles.infoValue}>{formatCurrency(agenda.header.projectValue)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Delivery Method</span>
              <span className={styles.infoValue}>{agenda.header.deliveryMethod || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Project Executive</span>
              <span className={styles.infoValue}>{agenda.header.projectExecutive || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Project Manager</span>
              <span className={styles.infoValue}>{agenda.header.projectManager || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Lead Estimator</span>
              <span className={styles.infoValue}>{agenda.header.leadEstimator || '—'}</span>
            </div>
          </HbcCard>
        );

      // ── 2. Meeting Attendees ──
      // SOP: Required (PE, PM, APM, Superintendent, Lead Estimator) + Optional (VP Ops, Chief Estimator)
      case 'attendees':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <div style={{ marginBottom: '8px', fontWeight: tokens.fontWeightSemibold, color: HBC_COLORS.navy }}>
              Required Attendees
            </div>
            {agenda.signatures.map(sig => (
              <div key={sig.id} className={styles.infoRow}>
                <span className={styles.infoLabel}>{sig.role}</span>
                <span className={styles.infoValue}>{sig.signerName}</span>
              </div>
            ))}
            {agenda.pmName && (
              <>
                <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: tokens.fontWeightSemibold, color: HBC_COLORS.navy }}>
                  Optional Attendees
                </div>
                {agenda.pmName && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Assistant Project Manager</span>
                    <span className={styles.infoValue}>{agenda.apmName || '—'}</span>
                  </div>
                )}
              </>
            )}
          </HbcCard>
        );

      // ── 3. Pre-Meeting Prerequisites ──
      // SOP: PM/Superintendent familiarize with plans & specs, site visit, Lead Estimator prepares agenda
      case 'prerequisites':
        return (
          <HbcCard
            key={section.id}
            title={section.label}
            className={styles.sectionCard}
            headerActions={
              <StatusBadge
                label={`${prereqComplete}/${prereqTotal}`}
                color={prereqComplete === prereqTotal ? HBC_COLORS.success : HBC_COLORS.warning}
                backgroundColor={prereqComplete === prereqTotal ? HBC_COLORS.successLight : HBC_COLORS.warningLight}
                size="medium"
              />
            }
          >
            <ProgressBar
              value={prereqTotal > 0 ? prereqComplete / prereqTotal : 0}
              thickness="large"
              color={prereqComplete === prereqTotal ? 'success' : 'brand'}
              style={{ marginBottom: '12px' }}
            />
            {agenda.prerequisites.map(prereq => (
              <div key={prereq.id} className={styles.prereqItem}>
                <Checkbox
                  checked={prereq.completed}
                  disabled={!isEditMode}
                  onChange={() => {
                    if (isEditMode) {
                      updatePrerequisiteMutation.mutate({
                        id: prereq.id,
                        data: {
                          completed: !prereq.completed,
                          completedBy: !prereq.completed ? (currentUser?.displayName ?? 'Unknown') : undefined,
                          completedDate: !prereq.completed ? new Date().toISOString() : undefined,
                        },
                      });
                    }
                  }}
                  aria-label={prereq.label}
                />
                <div className={styles.prereqContent}>
                  <span className={prereq.completed ? styles.prereqLabelDone : styles.prereqLabel}>
                    {prereq.label}
                  </span>
                  <span className={styles.prereqDescription}>{prereq.description}</span>
                  {prereq.completed && prereq.completedBy && (
                    <span className={styles.prereqBadge}>
                      Completed by {prereq.completedBy} on {prereq.completedDate ? formatNoteTimestamp(prereq.completedDate) : '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </HbcCard>
        );

      // ── 4. Purpose ──
      // SOP verbatim: "To ensure a smooth and efficient transition..."
      case 'purpose':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <div className={styles.purposeCallout}>
              {SOP_PURPOSE_TEXT}
            </div>
          </HbcCard>
        );

      // ── 5. General Project Information + 6-14. Discussion-backed sections ──
      case 'general-info':
      case 'drawings-review':
      case 'risks':
      case 'savings-shortfalls':
      case 'lead-times':
      case 'sub-proposals':
      case 'buyouts':
      case 'scope-gaps':
      case 'sdi-policy':
      case 'post-meeting': {
        // Discussion items are matched by their label convention or sortOrder.
        // Each SOP section corresponds to one or more ITurnoverDiscussionItem entries.
        const matchingItems = agenda.discussionItems.filter(
          di => di.label.toLowerCase().includes(section.label.toLowerCase().split(' ')[0].toLowerCase())
        );
        const fallbackItems = matchingItems.length > 0 ? matchingItems : agenda.discussionItems.filter(
          (_, idx) => {
            const sectionIdx = TURNOVER_SOP_SECTIONS.findIndex(s => s.id === section.id);
            return idx === sectionIdx;
          }
        );
        const items = fallbackItems.length > 0 ? fallbackItems : [{ id: -1, turnoverAgendaId: agenda.id, sortOrder: 0, label: section.label, description: '', discussed: false, notes: '', attachments: [] }];

        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            {items.map(item => (
              <div key={item.id} className={styles.discussionItem}>
                {item.id !== -1 && (
                  <>
                    <div className={styles.discussionLabel}>{item.label}</div>
                    {isEditMode ? (
                      <RichTextField
                        value={item.notes}
                        onChange={(html) => {
                          if (item.id !== -1) {
                            updateDiscussionItemMutation.mutate({
                              id: item.id,
                              data: { notes: html },
                            });
                          }
                        }}
                        placeholder="Add notes..."
                        onAttach={(file) => {
                          // TODO: Wire to attachment upload service when available
                          // eslint-disable-next-line no-console
                          console.log('[DiscussionItem] File attached:', file.name, 'for item', item.id);
                        }}
                      />
                    ) : (
                      <div className={styles.richTextReadOnly} dangerouslySetInnerHTML={{ __html: item.notes || 'No notes yet.' }} />
                    )}
                    {isEditMode && (
                      <Checkbox
                        checked={item.discussed}
                        label="Discussed"
                        style={{ marginTop: '8px' }}
                        onChange={() => {
                          updateDiscussionItemMutation.mutate({
                            id: item.id,
                            data: { discussed: !item.discussed },
                          });
                        }}
                      />
                    )}
                  </>
                )}
                {item.id === -1 && (
                  <div className={styles.discussionNotes}>No discussion items configured for this section.</div>
                )}
              </div>
            ))}
            {/* Stage 19 Sub-task 4: Per-section thread — always active (no isEditMode gate).
              * Users can comment on any section in both packet and edit modes. */}
            <TurnoverThread
              sectionId={section.id}
              notes={sectionNotes[section.id] ?? []}
              currentUserName={currentUser?.displayName ?? 'Unknown'}
              onPost={handlePostNote}
            />
          </HbcCard>
        );
      }

      // ── 7. Project Estimate Overview ──
      // SOP: Contract Value, Duration, Total GC, Total GR, Site Maintenance,
      // Contingency/Escalation, Gross Profit Margin NIC Buyout, Anticipated Buyout, Procore
      case 'estimate-overview':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Contract Value</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.contractAmount)}</span>
            </div>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Original Estimate</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.originalEstimate)}</span>
            </div>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Buyout Target</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.buyoutTarget)}</span>
            </div>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Estimated Fee</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.estimatedFee)}</span>
            </div>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Estimated Gross Margin</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.estimatedGrossMargin)}</span>
            </div>
            <div className={styles.estimateRow}>
              <span className={styles.estimateLabel}>Construction Contingency / Escalation</span>
              <span className={styles.estimateValue}>{formatCurrency(agenda.estimateOverview.contingency)}</span>
            </div>
            {(agenda.estimateOverview.notes || isEditMode) && (
              <div className={styles.discussionItem}>
                <div className={styles.discussionLabel}>Notes</div>
                {isEditMode ? (
                  <RichTextField
                    value={agenda.estimateOverview.notes}
                    onChange={(html) => updateEstimateOverviewMutation.mutate({ notes: html })}
                    placeholder="Add estimate overview notes..."
                    onAttach={(file) => {
                      // TODO: Wire to attachment upload service when available
                      // eslint-disable-next-line no-console
                      console.log('[EstimateOverview] File attached:', file.name);
                    }}
                  />
                ) : (
                  <div className={styles.richTextReadOnly} dangerouslySetInnerHTML={{ __html: agenda.estimateOverview.notes }} />
                )}
              </div>
            )}
          </HbcCard>
        );

      // ── 15. Preferred & Required Subcontractors ──
      // SOP: Trade, Subcontractor, Email, Phone, Compass (Q-Score)
      // "If any substitutions are proposed, please provide a strong justification for the change"
      case 'preferred-subs':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <DataGrid
              items={agenda.subcontractors}
              columns={subcontractorColumns}
              getRowId={(item) => String(item.id)}
              aria-label="Preferred and Required Subcontractors"
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<ITurnoverSubcontractor>>
                {({ item, rowId }) => (
                  <DataGridRow<ITurnoverSubcontractor> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </HbcCard>
        );

      // ── 16. Contract Document Exhibits ──
      // SOP: Cost Summary, Clarifications & Assumptions, Alternates, Allowances,
      // Value Analysis Log, Project Schedule, Site Logistics, Labor Rates, RFIs, Other
      case 'exhibits':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            {agenda.exhibits.map(exhibit => (
              <div key={exhibit.id} className={styles.exhibitItem}>
                <span className={styles.exhibitLabel}>{exhibit.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {exhibit.reviewed ? (
                    <Badge appearance="filled" color="success">Reviewed</Badge>
                  ) : (
                    <Badge appearance="outline" color="warning">Pending</Badge>
                  )}
                  {isEditMode && !exhibit.reviewed && (
                    <Button
                      size="small"
                      onClick={() => updateExhibitMutation.mutate({
                        id: exhibit.id,
                        data: {
                          reviewed: true,
                          reviewedBy: currentUser?.displayName ?? 'Unknown',
                          reviewedDate: new Date().toISOString(),
                        },
                      })}
                    >
                      Mark Reviewed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </HbcCard>
        );

      // ── 18. Summary & Sign-off ──
      // SOP: "The undersigned hereby acknowledges having reviewed and accepted the foregoing items."
      // SOP Signature block: Lead Estimator, Project Executive, Project Manager, Superintendent
      case 'summary-signoff':
        return (
          <HbcCard key={section.id} title={section.label} className={styles.sectionCard}>
            <div className={styles.affidavitCallout}>
              {SOP_AFFIDAVIT_TEXT}
            </div>
            {agenda.signatures.map(sig => {
              const isCurrentUser = currentUser?.email?.toLowerCase() === sig.signerEmail?.toLowerCase();
              return (
                <div key={sig.id} className={styles.signatureRow}>
                  <Checkbox checked={sig.signed} disabled />
                  <div className={styles.signatureInfo}>
                    <span className={styles.signatureRole}>{sig.role}</span>
                    <span className={styles.signatureName}>{sig.signerName}</span>
                  </div>
                  {sig.signed ? (
                    <div className={styles.signedBadge}>
                      <Checkmark24Regular />
                      <span>Signed {sig.signedDate ? formatSignatureDate(sig.signedDate) : ''}</span>
                    </div>
                  ) : (
                    <Button
                      appearance="primary"
                      disabled={!isCurrentUser || !isEditMode}
                      onClick={() => {
                        signMutation.mutate({ signatureId: sig.id });
                      }}
                    >
                      I Accept
                    </Button>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <StatusBadge
                label={`${signaturesComplete}/${signaturesTotal} Signatures`}
                color={signaturesComplete === signaturesTotal ? HBC_COLORS.success : HBC_COLORS.warning}
                backgroundColor={signaturesComplete === signaturesTotal ? HBC_COLORS.successLight : HBC_COLORS.warningLight}
                size="medium"
              />
            </div>
          </HbcCard>
        );

      default:
        return null;
    }
  };

  // ── Render: Presentation Mode ──
  if (isPresentationMode) {
    return (
      <>
        <div id="turnover-page-root">
          {/* Toolbar always visible in presentation mode */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <Button icon={<ChevronLeft24Regular />} appearance="subtle" onClick={handlePrevSection} aria-label="Previous section" />
              <span className={styles.sectionTitle}>{currentSectionTitle}</span>
              <Button icon={<ChevronRight24Regular />} appearance="subtle" onClick={handleNextSection} aria-label="Next section" />
            </div>
            <div className={styles.toolbarCenter}>
              <Button appearance="subtle" onClick={handleViewAllSections}>View All Sections</Button>
            </div>
            <div className={styles.toolbarRight}>
              <Tooltip content="Pop-out Agenda" relationship="label">
                <Button icon={<WindowNew24Regular />} appearance="subtle" onClick={handlePopOutAgenda} aria-label="Pop-out Agenda" />
              </Tooltip>
              <Button
                icon={<Dismiss24Regular />}
                appearance="subtle"
                onClick={() => {
                  startTransition(() => setIsPresentationMode(false));
                  exitFullScreen();
                }}
                aria-label="Exit Presentation Mode"
              />
            </div>
          </div>

          {/* Two-column layout: 22% agenda + 78% content */}
          <div className={styles.presentationContainer}>
            <div className={styles.presentationAgenda}>
              {SECTION_GROUPS.map(group => (
                <React.Fragment key={group}>
                  <div className={styles.presentationAgendaGroup}>{group}</div>
                  {TURNOVER_SOP_SECTIONS.filter(s => s.group === group).map(s => (
                    <div
                      key={s.id}
                      className={mergeClasses(
                        styles.presentationAgendaItem,
                        activeSectionId === s.id && styles.presentationAgendaItemActive
                      )}
                      onClick={() => startTransition(() => setActiveSectionId(s.id))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && startTransition(() => setActiveSectionId(s.id))}
                    >
                      {s.label}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className={mergeClasses(styles.presentationContent, styles.pageContentWithPanel)}>
              {sectionsToRender.map(renderSection)}
            </div>
          </div>
        </div>
        {/* Stage 19 Sub-task 4: Floating discussion panel — visible in Presentation Mode */}
        {floatingDiscussionPanel}
      </>
    );
  }

  // ── Render: Normal Mode (packet or edit) ──
  return (
    <>
    <div className={mergeClasses(styles.root, styles.pageContentWithPanel)} id="turnover-page-root">
      <PageHeader
        title="Estimating to Operations Turnover Meeting"
        subtitle={`${projectCode} — ${agenda.projectName}`}
      />

      {/* BD Client & Project Notes — pinned banner card, always visible (SOP aspect 6) */}
      <div className={styles.bdBanner}>
        <div>
          <div className={styles.bdBannerLabel}>Owner</div>
          <div className={styles.bdBannerValue}>{agenda.header.clientName || '—'}</div>
        </div>
        <div>
          <div className={styles.bdBannerLabel}>Project Executive</div>
          <div className={styles.bdBannerValue}>{agenda.header.projectExecutive || '—'}</div>
        </div>
        <div>
          <div className={styles.bdBannerLabel}>Lead Estimator</div>
          <div className={styles.bdBannerValue}>{agenda.header.leadEstimator || '—'}</div>
        </div>
        <div>
          <div className={styles.bdBannerLabel}>Delivery Method</div>
          <div className={styles.bdBannerValue}>{agenda.header.deliveryMethod || '—'}</div>
        </div>
        <div>
          <div className={styles.bdBannerLabel}>Project Value</div>
          <div className={styles.bdBannerValue}>{formatCurrency(agenda.header.projectValue)}</div>
        </div>
        <div>
          <div className={styles.bdBannerLabel}>Status</div>
          <div className={styles.bdBannerValue}>
            <StatusBadge
              label={agenda.status}
              color={agenda.status === TurnoverStatus.Complete ? HBC_COLORS.success : HBC_COLORS.info}
              backgroundColor={agenda.status === TurnoverStatus.Complete ? HBC_COLORS.successLight : HBC_COLORS.infoLight}
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Top Toolbar — section title, navigation, mode toggles (SOP aspect 3) */}
      <div className={styles.toolbar} role="toolbar" aria-label="Turnover meeting controls">
        <div className={styles.toolbarLeft}>
          <Button
            icon={<ChevronLeft24Regular />}
            appearance="subtle"
            onClick={handlePrevSection}
            disabled={activeSectionId === null}
            aria-label="Previous section"
          />
          <span className={styles.sectionTitle}>{currentSectionTitle}</span>
          <Button
            icon={<ChevronRight24Regular />}
            appearance="subtle"
            onClick={handleNextSection}
            disabled={activeSectionId === null}
            aria-label="Next section"
          />
        </div>
        <div className={styles.toolbarCenter}>
          {activeSectionId && (
            <Button appearance="subtle" onClick={handleViewAllSections} size="small">
              View All Sections
            </Button>
          )}
        </div>
        <div className={styles.toolbarRight}>
          {/* Role-gated Edit + Start Meeting — visible to Admin, Leadership, Estimator, Precon Manager, Ops Managers */}
          <RoleGate allowedRoles={TURNOVER_EDIT_ROLES}>
            <Button
              appearance={isEditMode ? 'primary' : 'subtle'}
              icon={<NoteEdit24Regular />}
              onClick={() => startTransition(() => setIsEditMode(!isEditMode))}
              aria-label={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            >
              {isEditMode ? 'Editing' : 'Edit'}
            </Button>
            <Button
              appearance="primary"
              icon={<SlideText24Regular />}
              onClick={() => startTransition(() => setIsEditMode(true))}
            >
              Start Turnover Meeting
            </Button>
          </RoleGate>
          <Tooltip content="Presentation Mode — optimized for conference room projection" relationship="label">
            <Button
              icon={<SlideText24Regular />}
              appearance="subtle"
              onClick={() => {
                startTransition(() => {
                  setIsPresentationMode(true);
                  if (!activeSectionId) {
                    setActiveSectionId(TURNOVER_SOP_SECTIONS[0].id);
                  }
                });
                toggleFullScreen();
              }}
              aria-label="Presentation Mode"
            />
          </Tooltip>
        </div>
      </div>

      {/* KPI summary row */}
      <div className={styles.kpiGrid}>
        <KPICard title="Prerequisites" value={`${prereqComplete}/${prereqTotal}`} subtitle={prereqComplete === prereqTotal ? 'Complete' : 'In Progress'} />
        <KPICard title="Discussion Items" value={String(agenda.discussionItems.filter(d => d.discussed).length)} subtitle={`of ${agenda.discussionItems.length} discussed`} />
        <KPICard title="Exhibits Reviewed" value={String(agenda.exhibits.filter(e => e.reviewed).length)} subtitle={`of ${agenda.exhibits.length}`} />
        <KPICard title="Signatures" value={`${signaturesComplete}/${signaturesTotal}`} subtitle={signaturesComplete === signaturesTotal ? 'All signed' : 'Pending'} />
      </div>

      {/* Stage 19 Sub-task 4: Global Discussion Thread REMOVED from inline flow —
        * now rendered as a persistent floating bottom-sheet panel (see floatingDiscussionPanel).
        * The global thread is always visible and accessible regardless of scroll position. */}

      {/* Section content — single focused section or all sections stacked */}
      {sectionsToRender.map(renderSection)}
    </div>
    {/* Stage 19 Sub-task 4: Floating discussion panel — visible in Normal Mode */}
    {floatingDiscussionPanel}
    </>
  );
};
