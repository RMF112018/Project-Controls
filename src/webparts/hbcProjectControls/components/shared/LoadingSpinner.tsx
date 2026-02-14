import * as React from 'react';
import { Spinner, makeStyles, shorthands } from '@fluentui/react-components';
import { SPACING } from '../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(SPACING.xxl),
    ...shorthands.gap('12px'),
  },
});

interface ILoadingSpinnerProps {
  label?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({ label = 'Loading...', size = 'medium' }) => {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <Spinner size={size} label={label} />
    </div>
  );
};
