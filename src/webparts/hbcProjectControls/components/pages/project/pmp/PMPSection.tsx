import * as React from 'react';
import { HBC_COLORS } from '../../../../theme/tokens';

interface IPMPSectionProps {
  number: string;
  title: string;
  sourceType: string;
  isGrayed?: boolean;
  children: React.ReactNode;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  boilerplate: { label: 'Policy', color: HBC_COLORS.gray400 },
  module: { label: 'Live Data', color: HBC_COLORS.success },
  'pmp-only': { label: 'PMP', color: HBC_COLORS.orange },
  mixed: { label: 'Mixed', color: '#3B82F6' },
  link: { label: 'Link', color: '#8B5CF6' },
};

export const PMPSection: React.FC<IPMPSectionProps> = ({ number, title, sourceType, isGrayed, children }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const source = SOURCE_LABELS[sourceType] ?? SOURCE_LABELS.boilerplate;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden', opacity: isGrayed ? 0.5 : 1 }}>
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpanded ? HBC_COLORS.gray50 : '#fff', borderBottom: isExpanded ? `1px solid ${HBC_COLORS.gray200}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: HBC_COLORS.gray400 }}>{isExpanded ? '▼' : '▶'}</span>
          <span style={{ fontWeight: 700, color: HBC_COLORS.navy, fontSize: 15 }}>Section {number}</span>
          <span style={{ color: HBC_COLORS.navy, fontSize: 14 }}>{title}</span>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, backgroundColor: `${source.color}20`, color: source.color }}>{source.label}</span>
      </div>
      {isExpanded && <div style={{ padding: 20 }}>{children}</div>}
    </div>
  );
};
