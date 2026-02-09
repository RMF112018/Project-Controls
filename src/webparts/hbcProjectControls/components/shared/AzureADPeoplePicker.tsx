import * as React from 'react';
import { IPersonAssignment } from '../../models/IWorkflowDefinition';
import { HBC_COLORS } from '../../theme/tokens';
import mockUsers from '../../mock/users.json';

interface IAzureADPeoplePickerProps {
  selectedUser: IPersonAssignment | null;
  onSelect: (user: IPersonAssignment | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const AzureADPeoplePicker: React.FC<IAzureADPeoplePickerProps> = ({
  selectedUser,
  onSelect,
  label,
  placeholder = 'Search people...',
  disabled = false,
}) => {
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return mockUsers;
    const q = query.toLowerCase();
    return mockUsers.filter(u =>
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (user: typeof mockUsers[0]): void => {
    onSelect({
      userId: String(user.id),
      displayName: user.displayName,
      email: user.email,
    });
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
          {label}
        </label>
      )}

      {selectedUser && selectedUser.userId ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '6px',
          border: `1px solid ${HBC_COLORS.gray200}`,
          backgroundColor: HBC_COLORS.gray50,
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: HBC_COLORS.navy,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {selectedUser.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.navy }}>{selectedUser.displayName}</div>
            <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{selectedUser.email}</div>
          </div>
          {!disabled && (
            <span
              onClick={handleClear}
              style={{ color: HBC_COLORS.gray400, cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              title="Clear"
            >
              &times;
            </span>
          )}
        </div>
      ) : (
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            border: `1px solid ${isOpen ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: disabled ? HBC_COLORS.gray100 : '#fff',
          }}
        />
      )}

      {isOpen && !selectedUser?.userId && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#fff',
          border: `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: '240px',
          overflow: 'auto',
          marginTop: '2px',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '13px' }}>
              No matching people
            </div>
          ) : (
            filtered.map(user => (
              <div
                key={user.id}
                onClick={() => handleSelect(user)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = HBC_COLORS.gray50)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: HBC_COLORS.lightNavy,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{user.displayName}</div>
                  <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{user.email}</div>
                </div>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>
                  {user.department}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
