import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from '@components/App';
import { MockDataService } from '@services/MockDataService';
import { RenderMode, RoleName } from '@models/enums';
import { RoleSwitcher } from './RoleSwitcher';
import { setMockUserRole, getMockUserRole } from './mockContext';

const dataService = new MockDataService();

const MODE_OPTIONS: { label: string; mode: RenderMode }[] = [
  { label: 'Hub', mode: RenderMode.Full },
  { label: 'Project', mode: RenderMode.Project },
  { label: 'Precon', mode: RenderMode.Standalone },
];

const DevToolbar: React.FC<{
  mode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
}> = ({ mode, onModeChange }) => {
  const [hovered, setHovered] = React.useState<RenderMode | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: 'rgba(27, 42, 74, 0.92)',
        borderRadius: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        zIndex: 9999,
        userSelect: 'none',
        padding: '0 4px 0 12px',
        height: 34,
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          marginRight: 10,
          whiteSpace: 'nowrap',
        }}
      >
        DEV PREVIEW
      </span>
      <div
        style={{
          width: 1,
          height: 18,
          background: 'rgba(255,255,255,0.25)',
          marginRight: 6,
        }}
      />
      <div style={{ display: 'flex', gap: 3, padding: '3px 0' }}>
        {MODE_OPTIONS.map(({ label, mode: optMode }) => {
          const isActive = optMode === mode;
          const isHover = optMode === hovered && !isActive;
          return (
            <button
              key={optMode}
              onClick={() => onModeChange(optMode)}
              onMouseEnter={() => setHovered(optMode)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                cursor: isActive ? 'default' : 'pointer',
                background: isActive
                  ? '#E87722'
                  : isHover
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                outline: 'none',
                transition: 'background 0.15s, color 0.15s',
                lineHeight: '20px',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DevRoot: React.FC = () => {
  const [mode, setMode] = React.useState<RenderMode>(RenderMode.Full);
  const [role, setRole] = React.useState<RoleName>(getMockUserRole());

  const handleModeChange = React.useCallback(
    (newMode: RenderMode) => {
      if (newMode === mode) return;
      window.location.hash = '#/';
      setMode(newMode);
    },
    [mode]
  );

  const handleRoleChange = React.useCallback(
    (newRole: RoleName) => {
      if (newRole === role) return;
      setMockUserRole(newRole);
      dataService.setCurrentUserRole(newRole);
      window.location.hash = '#/';
      setRole(newRole);
    },
    [role]
  );

  return (
    <>
      <App key={`${mode}-${role}`} dataService={dataService} renderMode={mode} />
      <RoleSwitcher role={role} onRoleChange={handleRoleChange} />
      <DevToolbar mode={mode} onModeChange={handleModeChange} />
    </>
  );
};

ReactDOM.render(<DevRoot />, document.getElementById('root'));
