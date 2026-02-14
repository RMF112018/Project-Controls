import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  root: {
    marginBottom: '24px',
  },
  breadcrumbRow: {
    marginBottom: '8px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  title: {
    ...shorthands.margin('0'),
    fontSize: '24px',
    fontWeight: '700',
    color: HBC_COLORS.navy,
  },
  subtitle: {
    ...shorthands.margin('4px', '0', '0', '0'),
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
});

interface IPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export const PageHeader: React.FC<IPageHeaderProps> = ({ title, subtitle, actions, breadcrumb }) => {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      {breadcrumb && <div className={styles.breadcrumbRow}>{breadcrumb}</div>}
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
};
