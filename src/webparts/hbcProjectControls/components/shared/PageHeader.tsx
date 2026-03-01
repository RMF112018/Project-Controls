import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    marginBottom: tokens.spacingVerticalL,
  },
  breadcrumbRow: {
    marginBottom: tokens.spacingVerticalS,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  title: {
    ...shorthands.margin('0'),
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  subtitle: {
    ...shorthands.margin(tokens.spacingVerticalXS, '0', '0', '0'),
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
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
