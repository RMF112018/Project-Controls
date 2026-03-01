import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from '@router';
import { useAppContext } from '../contexts/AppContext';

const useStyles = makeStyles({
  root: {
    padding: '48px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  heading: {
    color: tokens.colorBrandForeground1,
    marginBottom: '12px',
  },
  button: {
    marginTop: '16px',
    padding: '8px 20px',
    backgroundColor: tokens.colorBrandBackground,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
});

interface IProjectRequiredRouteProps {
  children: React.ReactNode;
}

export const ProjectRequiredRoute: React.FC<IProjectRequiredRouteProps> = ({ children }) => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const navigate = useNavigate();

  if (!selectedProject) {
    return (
      <main className={styles.root}>
        <div role="status">
        <h3 className={styles.heading}>No Project Selected</h3>
        <p>Select a project from the picker in the sidebar to view this tool.</p>
        <button
          onClick={() => navigate('/operations')}
          className={styles.button}
        >
          View Active Projects
        </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
