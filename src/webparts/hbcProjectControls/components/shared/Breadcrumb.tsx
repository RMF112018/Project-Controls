import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { HBC_COLORS } from '../../theme/tokens';
import { IBreadcrumbItem } from '@hbc/sp-services';

const useStyles = makeStyles({
  button: {
    color: HBC_COLORS.info,
    cursor: 'pointer',
    textDecoration: 'none',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    ...shorthands.padding('2px', '4px'),
    fontFamily: 'inherit',
    fontSize: 'inherit',
    ':hover': {
      textDecoration: 'underline',
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '2px',
      ...shorthands.borderRadius('2px'),
      textDecoration: 'underline',
    },
  },
});

interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
}

export const Breadcrumb: React.FC<IBreadcrumbProps> = ({ items }) => {
  const navigate = useAppNavigate();
  const styles = useStyles();

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', flexWrap: 'wrap' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span style={{ color: HBC_COLORS.gray400, userSelect: 'none' }} aria-hidden="true">/</span>
            )}
            {isLast || !item.path ? (
              <span
                style={{ color: HBC_COLORS.gray600, fontWeight: isLast ? 600 : 400 }}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => navigate(item.path!)}
                className={styles.button}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
