/**
 * useButtonStyles — Centralized button and button-container styles.
 *
 * Provides mergeable Griffel classes for button containers (action bars,
 * toolbar rows, drawer footers, form actions) and button variants (compact
 * sizing, toolbar emphasis, WCAG 2.2 AA touch targets).
 *
 * Composes with HbcButton — does not replace it. HbcButton handles per-button
 * emphasis/loading/icon-only; useButtonStyles handles containers and
 * supplementary variants.
 *
 * @example
 * ```tsx
 * const btnStyles = useButtonStyles();
 * <div className={btnStyles.actionBar}>
 *   <div className={btnStyles.actionGroup}>
 *     <ExportButtons ... />
 *   </div>
 *   <div className={btnStyles.actionGroup}>
 *     <HbcButton emphasis="strong">Save</HbcButton>
 *   </div>
 * </div>
 * ```
 */
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { TOUCH_TARGET } from '../../theme/tokens';

export const useButtonStyles = makeStyles({
  // ── Containers ─────────────────────────────────────────────────────

  /** Full-width space-between bar with border-top separator (page-level action bars). */
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    flexWrap: 'wrap',
  },

  /** Inline flex group within an actionBar (groups related buttons together). */
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },

  /** Right-aligned cancel/save footer for SlideDrawer footers with border-top. */
  drawerFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalM, '0', '0'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },

  /** Left-aligned submit button row for forms (no border separator). */
  formActions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalL, '0', '0'),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },

  /** Full-width space-between container for table toolbars (search left, actions right). */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
    ...shorthands.gap(tokens.spacingHorizontalM),
  },

  /** Compact inline group for toolbar icon buttons (right side of toolbar). */
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },

  /** Compact inline container for export format buttons (PDF, Excel, CSV). */
  exportBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },

  /** "Export:" label text preceding export format buttons. */
  exportLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    marginRight: tokens.spacingHorizontalXS,
  },

  // ── Button variants ────────────────────────────────────────────────

  /** Small toolbar/export buttons — reduced min-width, base200 font. */
  compact: {
    fontSize: tokens.fontSizeBase200,
    minWidth: 'auto',
  },

  /** Semibold toolbar toggle button (e.g., Meeting Review mode). */
  toolbarEmphasis: {
    fontWeight: tokens.fontWeightSemibold,
  },

  /** WCAG 2.2 SC 2.5.8 AA — 44px minimum touch target for icon-only buttons. */
  iconOnly: {
    minWidth: TOUCH_TARGET.min,
    minHeight: TOUCH_TARGET.min,
    ...shorthands.padding('0'),
  },

  /** 48px preferred touch target for construction job-site tablet use (gloves, sunlight). */
  iconOnlyPreferred: {
    minWidth: TOUCH_TARGET.preferred,
    minHeight: TOUCH_TARGET.preferred,
    ...shorthands.padding('0'),
  },
});
