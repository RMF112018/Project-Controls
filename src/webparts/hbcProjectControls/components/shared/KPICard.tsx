import * as React from 'react';
import { Badge, createFocusOutlineStyle, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ELEVATION, TRANSITION } from '../../theme/tokens';
import { SlideDrawer } from './SlideDrawer';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    boxShadow: ELEVATION.level1,
    minWidth: '200px',
    transitionProperty: 'box-shadow',
    transitionDuration: TRANSITION.normal,
  },
  clickable: {
    cursor: 'pointer',
    position: 'relative',
    ':hover': {
      boxShadow: ELEVATION.level2,
    },
    ...createFocusOutlineStyle({ style: { outlineOffset: '2px' } }),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '4px',
  },
  value: {
    fontSize: '28px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
  },
  subtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginTop: '4px',
  },
  trend: {
    fontSize: '12px',
    marginTop: '6px',
  },
  icon: {
    color: tokens.colorNeutralForeground4,
  },
});

interface IKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  badge?: string;
  onClick?: () => void;
  drillDown?: React.ReactNode;
}

export const KPICard: React.FC<IKPICardProps> = ({ title, value, subtitle, icon, trend, badge, onClick, drillDown }) => {
  const styles = useStyles();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isClickable = !!(onClick || drillDown);

  const handleClick = (): void => {
    if (onClick) {
      onClick();
    } else if (drillDown) {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      <div
        role="group"
        aria-label={title}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? handleClick : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
        className={`${styles.card}${isClickable ? ` ${styles.clickable}` : ''}`}
      >
        <div className={styles.header}>
          <div>
            <div className={styles.title}>
              {title}
              {badge && <>{' '}<Badge appearance="tint" color="brand">{badge}</Badge></>}
            </div>
            <div className={styles.value}>{value}</div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            {trend && (
              <div className={styles.trend} style={{ color: trend.isPositive ? tokens.colorStatusSuccessForeground1 : tokens.colorStatusDangerForeground1 }}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </div>
            )}
          </div>
          {icon && <div className={styles.icon}>{icon}</div>}
        </div>
      </div>
      {drillDown && (
        <SlideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={title}>
          {drillDown}
        </SlideDrawer>
      )}
    </>
  );
};
