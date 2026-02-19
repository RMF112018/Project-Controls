import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { ButtonProps } from '@fluentui/react-components';
import { HbcButton } from './HbcButton';

export type HbcEmptyStateActionAppearance = 'primary' | 'secondary' | 'subtle';

export interface IHbcEmptyStateAction {
  id: string;
  label: string;
  onClick: () => void;
  appearance?: HbcEmptyStateActionAppearance;
  icon?: ButtonProps['icon'];
  priority?: number;
  isVisible?: () => boolean;
}

export interface IHbcEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: IHbcEmptyStateAction[];
  contextKey?: string;
  children?: React.ReactNode;
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    justifyItems: 'center',
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  icon: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    maxInlineSize: '56ch',
  },
  actionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalNone),
  },
  contentSlot: {
    display: 'grid',
    justifyItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
});

function mapActionAppearance(appearance: HbcEmptyStateActionAppearance | undefined): 'strong' | 'default' | 'subtle' {
  if (appearance === 'primary') {
    return 'strong';
  }

  if (appearance === 'subtle') {
    return 'subtle';
  }

  return 'default';
}

export const HbcEmptyState: React.FC<IHbcEmptyStateProps> = ({
  title,
  description,
  icon,
  actions = [],
  contextKey,
  children,
  className,
}) => {
  const styles = useStyles();

  const visibleActions = React.useMemo(() => (
    actions
      .filter((action) => action.isVisible ? action.isVisible() : true)
      .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0))
  ), [actions]);

  return (
    <section className={mergeClasses(styles.root, className)} aria-live="polite" data-empty-context={contextKey}>
      {icon ? <div className={styles.icon} aria-hidden="true">{icon}</div> : null}
      <div className={styles.title}>{title}</div>
      {description ? <div className={styles.description}>{description}</div> : null}
      {visibleActions.length > 0 ? (
        <div className={styles.actionRow}>
          {visibleActions.map((action) => (
            <HbcButton
              key={action.id}
              emphasis={mapActionAppearance(action.appearance)}
              icon={action.icon}
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.label}
            </HbcButton>
          ))}
        </div>
      ) : null}
      {children ? <div className={styles.contentSlot}>{children}</div> : null}
    </section>
  );
};

export default HbcEmptyState;
