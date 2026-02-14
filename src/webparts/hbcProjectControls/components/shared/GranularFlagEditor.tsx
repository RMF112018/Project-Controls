import * as React from 'react';
import { IGranularFlagDef } from '@hbc/sp-services';
import { HBC_COLORS } from '../../theme/tokens';

interface IGranularFlagEditorProps {
  flags: IGranularFlagDef[];
  selectedFlags: string[];
  onChange: (flags: string[]) => void;
  disabled?: boolean;
}

export const GranularFlagEditor: React.FC<IGranularFlagEditorProps> = ({
  flags,
  selectedFlags,
  onChange,
  disabled = false,
}) => {
  if (flags.length === 0) return null;

  const handleToggle = (key: string): void => {
    if (disabled) return;
    const updated = selectedFlags.includes(key)
      ? selectedFlags.filter(f => f !== key)
      : [...selectedFlags, key];
    onChange(updated);
  };

  return (
    <div style={{ padding: '8px 0 4px 0' }}>
      {flags.map(flag => {
        const checked = selectedFlags.includes(flag.key);
        return (
          <label
            key={flag.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '6px 0',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(flag.key)}
              disabled={disabled}
              style={{ marginTop: '2px', accentColor: HBC_COLORS.navy }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.gray800 }}>
                {flag.label}
              </div>
              <div style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>
                {flag.description}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
};
