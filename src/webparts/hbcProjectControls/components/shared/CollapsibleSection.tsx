import * as React from 'react';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';

interface ICollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<ICollapsibleSectionProps> = ({
  title,
  subtitle,
  defaultExpanded = true,
  badge,
  children,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: ELEVATION.level1,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '12px',
              color: HBC_COLORS.gray500,
            }}
          >
            {'\u25B6'}
          </span>
          <div>
            <span style={{ fontWeight: 600, fontSize: '15px', color: HBC_COLORS.navy }}>{title}</span>
            {subtitle && (
              <span style={{ marginLeft: 8, fontSize: '13px', color: HBC_COLORS.gray500 }}>{subtitle}</span>
            )}
          </div>
          {badge && <span>{badge}</span>}
        </div>
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: expanded ? '5000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div style={{ padding: '0 20px 16px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
