import { makeStyles, shorthands } from '@fluentui/react-components';
import { HBC_COLORS, SPACING, BREAKPOINTS } from './tokens';

export const useGlobalStyles = makeStyles({
  pageContainer: {
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...shorthands.padding(SPACING.lg),
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      ...shorthands.padding(SPACING.sm),
    },
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: HBC_COLORS.navy,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: HBC_COLORS.white,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding(SPACING.lg),
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginBottom: SPACING.md,
  },
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
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeSuccess: {
    backgroundColor: HBC_COLORS.successLight,
    color: '#065F46',
  },
  badgeWarning: {
    backgroundColor: HBC_COLORS.warningLight,
    color: '#92400E',
  },
  badgeError: {
    backgroundColor: HBC_COLORS.errorLight,
    color: '#991B1B',
  },
  badgeInfo: {
    backgroundColor: HBC_COLORS.infoLight,
    color: '#1E40AF',
  },
  tableSortable: {
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: HBC_COLORS.gray100,
    },
  },
});
