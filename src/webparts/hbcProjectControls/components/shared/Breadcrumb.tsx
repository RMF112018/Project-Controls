import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';
import { IBreadcrumbItem } from '../../utils/breadcrumbs';

interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
}

export const Breadcrumb: React.FC<IBreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', flexWrap: 'wrap' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span style={{ color: HBC_COLORS.gray400, userSelect: 'none' }} aria-hidden="true">/</span>
            )}
            {isLast || !item.path ? (
              <span style={{ color: HBC_COLORS.gray600, fontWeight: isLast ? 600 : 400 }}>
                {item.label}
              </span>
            ) : (
              <span
                role="link"
                tabIndex={0}
                onClick={() => navigate(item.path!)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(item.path!); }}
                style={{
                  color: HBC_COLORS.info,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
