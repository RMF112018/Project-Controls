import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from '@router';
import { useAppContext } from '../../contexts/AppContext';

const useStyles = makeStyles({
  root: {
    padding: '48px',
    textAlign: 'center',
  },
  heading: {
    color: tokens.colorBrandForeground1,
    marginBottom: '12px',
  },
  message: {
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
  },
  roleInfo: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '24px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    fontWeight: 600,
  },
});

export const AccessDeniedPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const roleLabel = currentUser?.roles?.join(', ') ?? 'Unknown';

  return (
    <div role="alert" className={styles.root}>
      <h2 className={styles.heading}>Access Denied</h2>
      <p className={styles.message}>
        You do not have permission to view this page.
      </p>
      <div className={styles.roleInfo}>
        Current role: {roleLabel}
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        className={styles.button}
      >
        Return to Dashboard
      </button>
    </div>
  );
};
