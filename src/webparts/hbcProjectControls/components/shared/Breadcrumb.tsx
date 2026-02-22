import * as React from 'react';
import {
  Home20Regular,
  Notepad20Regular,
  BuildingFactory20Regular,
  Settings20Regular,
} from '@fluentui/react-icons';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useAppContext } from '../contexts/AppContext';
import { getWorkspaceFromPath, type WorkspaceId } from '../navigation/workspaceConfig';
import { HBC_COLORS } from '../../theme/tokens';
import { IBreadcrumbItem } from '@hbc/sp-services';

const WORKSPACE_ICONS: Record<WorkspaceId, React.ReactNode> = {
  hub: <Home20Regular />,
  preconstruction: <Notepad20Regular />,
  operations: <BuildingFactory20Regular />,
  'shared-services': <Home20Regular />,
  admin: <Settings20Regular />,
  'qaqc-safety': <BuildingFactory20Regular />,
};

interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
}

export const Breadcrumb: React.FC<IBreadcrumbProps> = ({ items }) => {
  const navigate = useAppNavigate();
  const location = useAppLocation();
  const { isFeatureEnabled } = useAppContext();
  const suiteNav = isFeatureEnabled('uxSuiteNavigationV1');
  const activeWorkspace = getWorkspaceFromPath(location.pathname);

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', flexWrap: 'wrap' }}
    >
      {suiteNav && (
        <span style={{ display: 'flex', alignItems: 'center', color: HBC_COLORS.gray400, marginRight: '2px' }} aria-hidden="true">
          {WORKSPACE_ICONS[activeWorkspace]}
        </span>
      )}
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
