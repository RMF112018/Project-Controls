/**
 * useToolbarConfig — Toolbar layout styles for tracker/editor pages.
 *
 * Provides mergeable Griffel classes for the toolbar pattern:
 * search/filter left, action buttons right, responsive wrap.
 * Extracted from DepartmentTrackingPage toolbar patterns for reuse
 * across PostBidAutopsy, future tracker pages, and project-hub surfaces.
 *
 * @example
 * ```tsx
 * const tbStyles = useToolbarConfig();
 * <div className={tbStyles.toolbar}>
 *   <div className={tbStyles.searchGroup}>
 *     <SearchBar ... />
 *   </div>
 *   <div className={tbStyles.actionsGroup}>
 *     <Button icon={<ArrowDownload24Regular />} />
 *   </div>
 * </div>
 * ```
 */
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ELEVATION, TRANSITION } from '../../../../theme/tokens';

export const useToolbarConfig = makeStyles({
  /** Root toolbar container — full-width, responsive wrap. */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.gap(tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    flexWrap: 'wrap' as const,
  },

  /** Left-side search/filter group. */
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    flexGrow: 1,
    maxWidth: '400px',
  },

  /** Right-side action button group. */
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },

  /** Elevated toolbar for spotlight/fullscreen mode. */
  spotlightToolbar: {
    boxShadow: ELEVATION.level1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'box-shadow',
    transitionDuration: TRANSITION.normal,
  },

  /** Active toggle state for toolbar buttons. */
  activeToggle: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});
