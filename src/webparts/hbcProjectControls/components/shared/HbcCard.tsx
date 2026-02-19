import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

export interface IHbcCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  statusBadge?: React.ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    boxShadow: tokens.shadow4,
  },
  interactive: {
    cursor: 'pointer',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: tokens.shadow8,
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: tokens.strokeWidthThin,
    },
  },
  header: {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  headingBlock: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXXS),
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase400,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  content: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap(tokens.spacingHorizontalS),
    color: tokens.colorNeutralForeground3,
  },
});

export const HbcCard: React.FC<IHbcCardProps> = ({
  title,
  subtitle,
  headerActions,
  footer,
  statusBadge,
  interactive = false,
  onClick,
  children,
  className,
}) => {
  const styles = useStyles();

  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!interactive || !onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [interactive, onClick]);

  return (
    <div
      className={mergeClasses(styles.root, interactive ? styles.interactive : undefined, className)}
      onClick={interactive ? onClick : undefined}
      onKeyDown={onKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className={styles.header}>
        <div className={styles.headingBlock}>
          <div className={styles.title}>{title}</div>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>
        {headerActions ?? statusBadge}
      </div>
      {children ? <div className={styles.content}>{children}</div> : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
};

export default HbcCard;
