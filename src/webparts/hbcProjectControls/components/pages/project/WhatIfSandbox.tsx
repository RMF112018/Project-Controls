import * as React from 'react';
import { IScheduleScenario } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

interface IWhatIfSandboxProps {
  scenarios: IScheduleScenario[];
  onCreateScenario: (name: string) => Promise<void>;
}

export const WhatIfSandbox: React.FC<IWhatIfSandboxProps> = ({ scenarios, onCreateScenario }) => {
  const [name, setName] = React.useState('');

  const handleCreate = async (): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreateScenario(trimmed);
    setName('');
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 6 }}>What-If Sandbox</div>
      <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 14 }}>
        Scenario branching shell (create/list/diff/apply) with immutable timeline assumptions.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Scenario name"
          aria-label="Scenario name"
          style={inputStyle}
        />
        <button onClick={() => handleCreate().catch(() => undefined)} style={btnPrimary}>Create</button>
      </div>

      <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: 11, fontWeight: 700, color: HBC_COLORS.gray600, backgroundColor: HBC_COLORS.gray50, padding: '8px 10px' }}>
          <span>Name</span>
          <span>Created By</span>
          <span>Updated</span>
        </div>
        {scenarios.length === 0 && <div style={{ padding: 12, fontSize: 12, color: HBC_COLORS.gray500 }}>No scenarios yet.</div>}
        {scenarios.map(s => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: 12, padding: '8px 10px', borderTop: `1px solid ${HBC_COLORS.gray100}` }}>
            <span>{s.name}</span>
            <span>{s.createdBy}</span>
            <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 16,
  boxShadow: ELEVATION.level1,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`,
  fontSize: 13,
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: HBC_COLORS.orange,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
