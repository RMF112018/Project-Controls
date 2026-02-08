import * as React from 'react';
import { RoleName } from '@models/enums';

const ROLE_OPTIONS: { label: string; value: RoleName }[] = [
  { label: 'BD Representative', value: RoleName.BDRepresentative },
  { label: 'Estimating Coordinator', value: RoleName.EstimatingCoordinator },
  { label: 'Accounting Manager', value: RoleName.AccountingManager },
  { label: 'Preconstruction Team', value: RoleName.PreconstructionTeam },
  { label: 'Operations Team', value: RoleName.OperationsTeam },
  { label: 'Executive Leadership', value: RoleName.ExecutiveLeadership },
  { label: 'Legal', value: RoleName.Legal },
  { label: 'Risk Management', value: RoleName.RiskManagement },
  { label: 'Marketing', value: RoleName.Marketing },
  { label: 'Quality Control', value: RoleName.QualityControl },
  { label: 'Safety', value: RoleName.Safety },
  { label: 'IDS', value: RoleName.IDS },
];

export const RoleSwitcher: React.FC<{
  role: RoleName;
  onRoleChange: (role: RoleName) => void;
}> = ({ role, onRoleChange }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
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
        height: 34,
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* User icon */}
      <span
        style={{
          fontSize: 13,
          lineHeight: '34px',
          flexShrink: 0,
        }}
      >
        &#128100;
      </span>

      {/* Role pill badge */}
      <span
        style={{
          display: 'inline-block',
          background: '#E87722',
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
        {role}
      </span>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 18,
          background: 'rgba(255,255,255,0.25)',
          flexShrink: 0,
        }}
      />

      {/* Dropdown */}
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value as RoleName)}
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
          <option
            key={value}
            value={value}
            style={{
              background: '#1B2A4A',
              color: '#fff',
            }}
          >
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};
