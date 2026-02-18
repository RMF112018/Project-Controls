import * as React from 'react';
import { RoleName } from '@hbc/sp-services';

const DEV_SUPER_ADMIN = 'DEV_SUPER_ADMIN';
type RoleValue = RoleName | typeof DEV_SUPER_ADMIN;

const ROLE_OPTIONS: { label: string; value: RoleValue }[] = [
  { label: '\u26A1 DEV: Super-Admin', value: DEV_SUPER_ADMIN },
  { label: 'President / VP Operations', value: RoleName.ExecutiveLeadership },
  { label: 'OpEx Manager', value: RoleName.IDS },
  { label: 'Department Director', value: RoleName.DepartmentDirector },
  { label: 'SharePoint Admin', value: RoleName.SharePointAdmin },
  { label: 'Project Executive', value: RoleName.OperationsTeam },
  { label: 'Project Manager', value: RoleName.OperationsTeam },
  { label: 'Estimating Coordinator', value: RoleName.EstimatingCoordinator },
  { label: 'BD Representative', value: RoleName.BDRepresentative },
  { label: 'Accounting Controller', value: RoleName.AccountingManager },
  { label: 'Legal / Risk Manager', value: RoleName.Legal },
  { label: 'Marketing', value: RoleName.Marketing },
  { label: 'Quality Control', value: RoleName.QualityControl },
  { label: 'Safety', value: RoleName.Safety },
  { label: 'Read-Only Observer', value: RoleName.RiskManagement },
];

interface IRoleSwitcherProps {
  role: RoleValue;
  onRoleChange: (role: RoleValue) => void;
  mode: 'mock' | 'standalone';
  standaloneUser?: { displayName: string; email: string } | null;
  onSwitchMode: () => void;
  authError?: string | null;
}

export const RoleSwitcher: React.FC<IRoleSwitcherProps> = ({
  role,
  onRoleChange,
  mode,
  standaloneUser,
  onSwitchMode,
  authError,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const pillLabel = role === DEV_SUPER_ADMIN ? '\u26A1 SUPER-ADMIN' : role;
  const hasAadConfig = !!(process.env.AAD_CLIENT_ID);

  return (
    <div
      data-testid="role-switcher"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: isHovered
          ? 'rgba(27, 42, 74, 0.97)'
          : 'rgba(27, 42, 74, 0.92)',
        borderRadius: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        zIndex: 9999,
        userSelect: 'none',
        padding: '0 10px 0 10px',
        height: 'auto',
        minHeight: 34,
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: 6,
        paddingBottom: 6,
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mode indicator + switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: mode === 'mock' ? 6 : 0 }}>
        {mode === 'mock' ? (
          <>
            <span style={{ fontSize: 11, color: '#ffd700', fontWeight: 600, letterSpacing: 0.5 }}>
              MOCK MODE
            </span>
            {hasAadConfig && (
              <button
                onClick={onSwitchMode}
                style={{
                  fontSize: 11, padding: '2px 8px',
                  background: '#0078d4', color: '#fff',
                  border: 'none', borderRadius: 3, cursor: 'pointer',
                }}
              >
                Login (Real Data)
              </button>
            )}
          </>
        ) : (
          <>
            <span style={{ fontSize: 11, color: '#50fa7b', fontWeight: 600, letterSpacing: 0.5 }}>
              LIVE DATA
            </span>
            {standaloneUser && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                {standaloneUser.displayName || standaloneUser.email}
              </span>
            )}
            <button
              onClick={onSwitchMode}
              style={{
                fontSize: 11, padding: '2px 8px',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: 'none', borderRadius: 3, cursor: 'pointer',
              }}
            >
              ← Mock Mode
            </button>
            {authError && (
              <span style={{ fontSize: 10, color: '#ffd700', fontWeight: 600 }}>
                &#9888; Session issue
              </span>
            )}
          </>
        )}
      </div>

      {/* Role row — only shown in mock mode */}
      {mode === 'mock' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* User icon */}
          <span style={{ fontSize: 13, lineHeight: '22px', flexShrink: 0 }}>&#128100;</span>

          {/* Role pill badge */}
          <span
            style={{
              display: 'inline-block',
              background: role === DEV_SUPER_ADMIN ? '#EF4444' : '#E87722',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 10,
              padding: '2px 8px',
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              letterSpacing: 0.3,
            }}
          >
            {pillLabel}
          </span>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />

          {/* Dropdown */}
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as RoleValue)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 22px 2px 8px',
              outline: 'none',
              cursor: 'pointer',
              lineHeight: '20px',
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.6)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            {ROLE_OPTIONS.map(({ label, value }) => (
              <option key={label} value={value} style={{ background: '#1B2A4A', color: '#fff' }}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
