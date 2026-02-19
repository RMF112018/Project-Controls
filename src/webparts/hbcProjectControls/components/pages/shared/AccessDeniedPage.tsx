import * as React from 'react';
import { useNavigate } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const roleLabel = currentUser?.roles?.join(', ') ?? 'Unknown';

  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h2 style={{ color: HBC_COLORS.navy, marginBottom: 12 }}>Access Denied</h2>
      <p style={{ color: HBC_COLORS.gray600, marginBottom: 16 }}>
        You do not have permission to view this page.
      </p>
      <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 24 }}>
        Current role: {roleLabel}
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          padding: '8px 16px',
          borderRadius: 4,
          border: `1px solid ${HBC_COLORS.gray300}`,
          backgroundColor: '#fff',
          color: HBC_COLORS.navy,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Return to Dashboard
      </button>
    </div>
  );
};
