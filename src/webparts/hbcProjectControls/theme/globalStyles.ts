import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HBC_COLORS, SPACING, BREAKPOINTS, ELEVATION, TRANSITION } from './tokens';

export const useGlobalStyles = makeStyles({
  // ── Layout ──────────────────────────────────────────────
  pageContainer: {
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...shorthands.padding(SPACING.lg),
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      ...shorthands.padding(SPACING.sm),
    },
  },
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  mainContent: {
    flexGrow: 1,
    ...shorthands.padding(SPACING.lg),
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  mainContentMobile: {
    ...shorthands.padding(SPACING.md),
  },

  // ── Typography ──────────────────────────────────────────
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: HBC_COLORS.navy,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginBottom: SPACING.md,
  },

  // ── Card variants ───────────────────────────────────────
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    boxShadow: ELEVATION.level1,
  },
  cardElevated: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    boxShadow: ELEVATION.level2,
  },
  cardOutline: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    boxShadow: 'none',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  cardInteractive: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    boxShadow: ELEVATION.level1,
    cursor: 'pointer',
    transitionProperty: 'box-shadow',
    transitionDuration: TRANSITION.fast,
    ':hover': {
      boxShadow: ELEVATION.level2,
    },
  },

  // ── Header bar (navy bar pattern) ──────────────────────
  headerBar: {
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    ...shorthands.padding(SPACING.md, SPACING.lg),
    ...shorthands.borderRadius('8px', '8px', '0', '0'),
  },

  // ── Section divider ────────────────────────────────────
  sectionDivider: {
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },

  // ── Flex helpers ────────────────────────────────────────
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(SPACING.md),
  },
  flexWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(SPACING.md),
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Grid helpers ────────────────────────────────────────
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(SPACING.md),
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      gridTemplateColumns: '1fr',
    },
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    ...shorthands.gap(SPACING.md),
    [`@media (max-width: ${BREAKPOINTS.tablet}px)`]: {
      gridTemplateColumns: '1fr 1fr',
    },
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      gridTemplateColumns: '1fr',
    },
  },
  gridFour: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    ...shorthands.gap(SPACING.md),
    [`@media (max-width: ${BREAKPOINTS.tablet}px)`]: {
      gridTemplateColumns: '1fr 1fr',
    },
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      gridTemplateColumns: '1fr',
    },
  },

  // ── Badge variants ──────────────────────────────────────
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeSuccess: {
    backgroundColor: tokens.colorStatusSuccessBackground1,
    color: '#065F46',
  },
  badgeWarning: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: '#92400E',
  },
  badgeError: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: '#991B1B',
  },
  badgeInfo: {
    backgroundColor: HBC_COLORS.infoLight,
    color: '#1E40AF',
  },

  // ── Status badge base ───────────────────────────────────
  statusBadgeSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  statusBadgeMedium: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },

  // ── Form patterns ──────────────────────────────────────
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(SPACING.md),
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      gridTemplateColumns: '1fr',
    },
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    marginBottom: SPACING.xs,
  },
  formReadonly: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding(SPACING.sm, SPACING.md),
    ...shorthands.borderRadius('4px'),
    color: tokens.colorNeutralForeground2,
  },

  // ── Table patterns ─────────────────────────────────────
  tableContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    boxShadow: ELEVATION.level1,
    overflowX: 'auto',
  },
  tableHeaderCell: {
    ...shorthands.padding('8px', '12px'),
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    borderBottom: `2px solid ${HBC_COLORS.gray200}`,
    whiteSpace: 'nowrap',
  },
  tableCell: {
    ...shorthands.padding('10px', '12px'),
    fontSize: '13px',
    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
    color: tokens.colorNeutralForeground1,
  },
  tableSortable: {
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  tableRowClickable: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },

  // ── Action bar ─────────────────────────────────────────
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(SPACING.md),
    ...shorthands.gap(SPACING.sm),
    flexWrap: 'wrap',
  },

  // ── Empty state ────────────────────────────────────────
  emptyContainer: {
    textAlign: 'center',
    ...shorthands.padding(SPACING.xxl),
    color: tokens.colorNeutralForeground4,
  },

  // ── KPI grid ───────────────────────────────────────────
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(SPACING.md),
  },

  // ── Dropdown overlay ───────────────────────────────────
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('0', '0', '8px', '8px'),
    boxShadow: ELEVATION.level3,
    zIndex: 1000,
  },
  dropdownGroupHeader: {
    ...shorthands.padding('8px', '16px'),
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
  },
  dropdownItem: {
    ...shorthands.padding('8px', '16px'),
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },

  // ── Pagination ─────────────────────────────────────────
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  paginationButton: {
    ...shorthands.padding('4px', '12px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground1,
    fontSize: '13px',
    cursor: 'pointer',
  },
  paginationButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },

  // ── Spinner container ──────────────────────────────────
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(SPACING.xxl),
    ...shorthands.gap('12px'),
  },

  // ── Export bar ─────────────────────────────────────────
  exportBar: {
    display: 'flex',
    ...shorthands.gap('4px'),
    alignItems: 'center',
  },
  exportLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginRight: '4px',
  },
});
