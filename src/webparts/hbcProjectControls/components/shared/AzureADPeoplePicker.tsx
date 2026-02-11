import * as React from 'react';
import { IPersonAssignment } from '../../models/IWorkflowDefinition';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import mockUsers from '../../mock/users.json';

type IAzureADPeoplePickerProps = (
  | {
      multiSelect?: false;
      selectedUser: IPersonAssignment | null;
      onSelect: (user: IPersonAssignment | null) => void;
      selectedUsers?: undefined;
      onSelectMulti?: undefined;
    }
  | {
      multiSelect: true;
      selectedUsers: IPersonAssignment[];
      onSelectMulti: (users: IPersonAssignment[]) => void;
      selectedUser?: undefined;
      onSelect?: undefined;
    }
) & {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const AzureADPeoplePicker: React.FC<IAzureADPeoplePickerProps> = (props) => {
  const { label, placeholder = 'Search people...', disabled = false, multiSelect } = props;
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

  const selectedIds = React.useMemo(() => {
    if (multiSelect) {
      return new Set(props.selectedUsers.map(u => u.userId));
    }
    return new Set(props.selectedUser?.userId ? [props.selectedUser.userId] : []);
  }, [multiSelect, multiSelect ? props.selectedUsers : props.selectedUser]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return mockUsers;
    const q = query.toLowerCase();
    return mockUsers.filter(u =>
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelectUser = (user: typeof mockUsers[0]): void => {
    const person: IPersonAssignment = {
      userId: String(user.id),
      displayName: user.displayName,
      email: user.email,
    };

    if (multiSelect) {
      const current = props.selectedUsers;
      const exists = current.some(u => u.userId === person.userId);
      if (exists) {
        props.onSelectMulti(current.filter(u => u.userId !== person.userId));
      } else {
        props.onSelectMulti([...current, person]);
      }
      setQuery('');
    } else {
      props.onSelect(person);
      setQuery('');
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!multiSelect) {
      props.onSelect(null);
    }
    setQuery('');
  };

  const handleRemovePill = (userId: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (multiSelect) {
      props.onSelectMulti(props.selectedUsers.filter(u => u.userId !== userId));
    }
  };

  const initials = (name: string): string =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2);

  // Multi-select rendering
  if (multiSelect) {
    const hasSelection = props.selectedUsers.length > 0;
    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
        {label && (
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
            {label}
          </label>
        )}

        <div
          onClick={() => !disabled && setIsOpen(true)}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '4px 8px',
            minHeight: '36px',
            borderRadius: '6px',
            border: `1px solid ${isOpen ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
            backgroundColor: disabled ? HBC_COLORS.gray100 : '#fff',
            cursor: disabled ? 'default' : 'text',
            alignItems: 'center',
          }}
        >
          {props.selectedUsers.map(user => (
            <span
              key={user.userId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px 2px 4px',
                borderRadius: '12px',
                backgroundColor: HBC_COLORS.gray100,
                fontSize: '12px',
                fontWeight: 500,
                color: HBC_COLORS.navy,
              }}
            >
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: HBC_COLORS.navy, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 600,
              }}>
                {initials(user.displayName)}
              </span>
              {user.displayName}
              {!disabled && (
                <span
                  onClick={(e) => handleRemovePill(user.userId, e)}
                  style={{ cursor: 'pointer', color: HBC_COLORS.gray400, fontSize: '14px', lineHeight: 1, marginLeft: '2px' }}
                >
                  &times;
                </span>
              )}
            </span>
          ))}
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={hasSelection ? '' : placeholder}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '60px',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              padding: '2px 0',
              backgroundColor: 'transparent',
            }}
          />
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#fff',
            border: `1px solid ${HBC_COLORS.gray200}`,
            borderRadius: '6px',
            boxShadow: ELEVATION.level3,
            maxHeight: '240px',
            overflow: 'auto',
            marginTop: '2px',
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '13px' }}>
                No matching people
              </div>
            ) : (
              filtered.map(user => {
                const isSelected = selectedIds.has(String(user.id));
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      backgroundColor: isSelected ? HBC_COLORS.gray50 : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = HBC_COLORS.gray50; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: HBC_COLORS.lightNavy, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600, flexShrink: 0,
                    }}>
                      {initials(user.displayName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{user.displayName}</div>
                      <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{user.email}</div>
                    </div>
                    {isSelected && (
                      <span style={{ color: HBC_COLORS.success, fontSize: '16px', fontWeight: 700 }}>&#10003;</span>
                    )}
                    {!isSelected && (
                      <span style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{user.department}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // Single-select rendering (original behavior)
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
          {label}
        </label>
      )}

      {props.selectedUser && props.selectedUser.userId ? (
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
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: HBC_COLORS.navy, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, flexShrink: 0,
          }}>
            {initials(props.selectedUser.displayName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.navy }}>{props.selectedUser.displayName}</div>
            <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{props.selectedUser.email}</div>
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

      {isOpen && !props.selectedUser?.userId && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#fff',
          border: `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '6px',
          boxShadow: ELEVATION.level3,
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
                onClick={() => handleSelectUser(user)}
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
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: HBC_COLORS.lightNavy, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0,
                }}>
                  {initials(user.displayName)}
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
