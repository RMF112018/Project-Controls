import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';

type SkeletonVariant = 'table' | 'kpi-grid' | 'form' | 'card' | 'text';

interface ISkeletonLoaderProps {
  variant: SkeletonVariant;
  rows?: number;
  columns?: number;
  style?: React.CSSProperties;
}

const SHIMMER_ID = 'hbc-skeleton-shimmer';

function ensureShimmerStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_ID)) return;
  const style = document.createElement('style');
  style.id = SHIMMER_ID;
  style.textContent = `
    @keyframes hbc-shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hbc-skeleton-bar {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

const barStyle: React.CSSProperties = {
  background: `linear-gradient(90deg, ${HBC_COLORS.gray100} 25%, ${HBC_COLORS.gray200} 50%, ${HBC_COLORS.gray100} 75%)`,
  backgroundSize: '800px 100%',
  animation: 'hbc-shimmer 1.5s infinite linear',
  borderRadius: '4px',
};

const SkeletonBar: React.FC<{ width?: string; height?: string; style?: React.CSSProperties }> = ({
  width = '100%', height = '14px', style: extra,
}) => (
  <div className="hbc-skeleton-bar" style={{ ...barStyle, width, height, ...extra }} />
);

function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }): React.ReactElement {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBar key={i} width={i === 0 ? '30%' : `${Math.floor(70 / (columns - 1))}%`} height="12px" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBar key={i} width={i === 0 ? '30%' : `${Math.floor(70 / (columns - 1))}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

function KPIGridSkeleton({ columns = 4 }: { columns?: number }): React.ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
          <SkeletonBar width="60%" height="12px" />
          <SkeletonBar width="40%" height="28px" style={{ marginTop: '12px' }} />
          <SkeletonBar width="50%" height="10px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton({ rows = 6 }: { rows?: number }): React.ReactElement {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ marginBottom: '20px' }}>
          <SkeletonBar width="120px" height="12px" style={{ marginBottom: '8px' }} />
          <SkeletonBar width="100%" height="36px" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton(): React.ReactElement {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
      <SkeletonBar width="70%" height="16px" />
      <SkeletonBar width="100%" height="14px" style={{ marginTop: '12px' }} />
      <SkeletonBar width="90%" height="14px" style={{ marginTop: '8px' }} />
      <SkeletonBar width="40%" height="14px" style={{ marginTop: '8px' }} />
    </div>
  );
}

function TextSkeleton({ rows = 3 }: { rows?: number }): React.ReactElement {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBar key={i} width={i === rows - 1 ? '60%' : '100%'} height="14px" style={{ marginBottom: '10px' }} />
      ))}
    </div>
  );
}

export const SkeletonLoader: React.FC<ISkeletonLoaderProps> = ({ variant, rows, columns, style }) => {
  React.useEffect(() => { ensureShimmerStyles(); }, []);

  const content = (() => {
    switch (variant) {
      case 'table': return <TableSkeleton rows={rows} columns={columns} />;
      case 'kpi-grid': return <KPIGridSkeleton columns={columns} />;
      case 'form': return <FormSkeleton rows={rows} />;
      case 'card': return <CardSkeleton />;
      case 'text': return <TextSkeleton rows={rows} />;
      default: return <TableSkeleton rows={rows} columns={columns} />;
    }
  })();

  return <div style={style}>{content}</div>;
};
