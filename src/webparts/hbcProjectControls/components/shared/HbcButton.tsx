import * as React from 'react';
import { Button, Spinner, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { ButtonProps } from '@fluentui/react-components';

export type HbcButtonEmphasis = 'default' | 'strong' | 'subtle';

export interface IHbcButtonProps extends Omit<ButtonProps, 'icon'> {
  emphasis?: HbcButtonEmphasis;
  isLoading?: boolean;
  iconOnlyLabel?: string;
  icon?: ButtonProps['icon'];
}

const useStyles = makeStyles({
  root: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontWeight: tokens.fontWeightSemibold,
  },
  strong: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
  },
  subtle: {
    backgroundColor: tokens.colorSubtleBackground,
    color: tokens.colorNeutralForeground2,
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
  content: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
});

export const HbcButton: React.FC<IHbcButtonProps> = ({
  emphasis = 'default',
  isLoading = false,
  iconOnlyLabel,
  icon,
  children,
  className,
  disabled,
  ...rest
}) => {
  const styles = useStyles();

  const emphasisClass = emphasis === 'strong'
    ? styles.strong
    : emphasis === 'subtle'
      ? styles.subtle
      : undefined;

  const computedAriaLabel = iconOnlyLabel ?? rest['aria-label'];
  const hasContent = children !== null && children !== undefined;
  const fluentButtonProps = rest as ButtonProps;

  return (
    <Button
      {...fluentButtonProps}
      className={mergeClasses(styles.root, emphasisClass, className)}
      aria-label={computedAriaLabel}
      disabled={disabled || isLoading}
      icon={isLoading ? <Spinner size="tiny" /> : icon}
    >
      {hasContent ? <span className={styles.content}>{children}</span> : null}
    </Button>
  );
};

export default HbcButton;
