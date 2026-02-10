import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { InternalResponsibilityMatrix } from './InternalResponsibilityMatrix';
import { OwnerContractMatrix } from './OwnerContractMatrix';
import { SubContractMatrix } from './SubContractMatrix';
import { HBC_COLORS } from '../../../theme/tokens';
import { buildBreadcrumbs } from '../../../utils/breadcrumbs';

const TAB_PATHS = ['/operations/responsibility', '/operations/responsibility/owner-contract', '/operations/responsibility/sub-contract'];
const TAB_LABELS = ['Internal', 'Owner Contract', 'Sub-Contract'];

function pathToTab(pathname: string): number {
  const idx = TAB_PATHS.indexOf(pathname);
  return idx >= 0 ? idx : 0;
}

export const ResponsibilityMatrices: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);

  const tabStyle = (idx: number): React.CSSProperties => ({
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === idx ? 600 : 400,
    color: activeTab === idx ? HBC_COLORS.navy : HBC_COLORS.gray500,
    borderBottom: activeTab === idx ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
    transition: 'color 0.2s, border-bottom 0.2s',
  });

  return (
    <div>
      <PageHeader title="Responsibility Matrices" breadcrumb={<Breadcrumb items={breadcrumbs} />} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '20px' }}>
        {TAB_LABELS.map((label, idx) => (
          <div
            key={idx}
            style={tabStyle(idx)}
            onClick={() => navigate(TAB_PATHS[idx])}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <InternalResponsibilityMatrix />}
      {activeTab === 1 && <OwnerContractMatrix />}
      {activeTab === 2 && <SubContractMatrix />}
    </div>
  );
};
