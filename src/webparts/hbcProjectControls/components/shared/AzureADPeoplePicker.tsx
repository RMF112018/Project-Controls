import * as React from 'react';
import { Input } from '@fluentui/react-components';
import { IPersonAssignment } from '../../models/IGoNoGoScorecard';
import { HBC_COLORS } from '../../theme/tokens';

interface IAzureADPeoplePickerProps {
  selectedUser: IPersonAssignment | null;
  onSelect: (user: IPersonAssignment | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MOCK_USERS: IPersonAssignment[] = [
  { displayName: 'Mike Hedrick', email: 'mhedrick@hedrickbrothers.com' },
  { displayName: 'Todd Hedrick', email: 'thedrick@hedrickbrothers.com' },
  { displayName: 'David Park', email: 'dpark@hedrickbrothers.com' },
  { displayName: 'Katie Foster', email: 'kfoster@hedrickbrothers.com' },
  { displayName: 'Sarah Mitchell', email: 'smitchell@hedrickbrothers.com' },
  { displayName: 'Jorge Rodriguez', email: 'jrodriguez@hedrickbrothers.com' },
  { displayName: 'Brian Torres', email: 'btorres@hedrickbrothers.com' },
  { displayName: 'Rachel Chen', email: 'rchen@hedrickbrothers.com' },
];

export const AzureADPeoplePicker: React.FC<IAzureADPeoplePickerProps> = ({
  selectedUser,
  onSelect,
  label,
  placeholder = 'Search people...',
  disabled = false,
}) => {
  const [query, setQuery] = React.useState(selectedUser?.displayName || '');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return MOCK_USERS;
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [query]);

  React.useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    setQuery(selectedUser?.displayName || '');
  }, [selectedUser]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: HBC_COLORS.gray700, marginBottom: '4px' }}>
          {label}
        </label>
      )}
      <Input
        style={{ width: '100%' }}
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(_, d) => {
          setQuery(d.value);
          setShowDropdown(true);
          if (!d.value.trim()) onSelect(null);
        }}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filtered.length > 0 && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          border: `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
        }}>
          {filtered.map(user => (
            <button
              key={user.email}
              onClick={() => {
                onSelect(user);
                setQuery(user.displayName);
                setShowDropdown(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: selectedUser?.email === user.email ? HBC_COLORS.gray50 : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 500, color: HBC_COLORS.gray800 }}>{user.displayName}</div>
              <div style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>{user.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
