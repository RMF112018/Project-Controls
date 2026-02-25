import * as React from 'react';
import { useNavigate } from '@router';
import { useAppContext } from '../contexts/AppContext';
import { HBC_COLORS } from '../../theme/tokens';

interface IProjectRequiredRouteProps {
  children: React.ReactNode;
}

export const ProjectRequiredRoute: React.FC<IProjectRequiredRouteProps> = ({ children }) => {
  const { selectedProject } = useAppContext();
  const navigate = useNavigate();

  if (!selectedProject) {
    return (
      <main style={{
        padding: '48px',
        textAlign: 'center',
        color: HBC_COLORS.gray500,
      }}>
        <div role="status">
        <h3 style={{ color: HBC_COLORS.navy, marginBottom: '12px' }}>No Project Selected</h3>
        <p>Select a project from the picker in the sidebar to view this tool.</p>
        <button
          onClick={() => navigate('/operations')}
          style={{
            marginTop: '16px',
            padding: '8px 20px',
            backgroundColor: HBC_COLORS.navy,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          View Active Projects
        </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
