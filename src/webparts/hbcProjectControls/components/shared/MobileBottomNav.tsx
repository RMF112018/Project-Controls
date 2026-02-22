import * as React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  mergeClasses,
  Dialog,
  DialogSurface,
  DialogBody,
} from '@fluentui/react-components';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppContext, type ISelectedProject } from '../contexts/AppContext';
import { LAUNCHER_WORKSPACES, getWorkspaceFromPath, type IWorkspaceDefinition } from '../navigation/workspaceConfig';
import { NAV_GROUP_ROLES } from '@hbc/sp-services';
import { EnhancedProjectPicker } from './EnhancedProjectPicker';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    height: '56px',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: HBC_COLORS.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 1100,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('2px'),
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '10px',
    fontWeight: '500',
    cursor: 'pointer',
    ...shorthands.padding('4px', '8px'),
    minWidth: '48px',
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '-2px',
    },
  },
  tabActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('2px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    ...shorthands.borderRadius('16px'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    ...shorthands.padding('4px', '10px'),
    maxWidth: '72px',
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '2px',
    },
  },
  projectPillText: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60px',
    fontSize: '9px',
  },
  dialogSurface: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    maxHeight: '70vh',
    ...shorthands.borderRadius('16px', '16px', '0', '0'),
    ...shorthands.padding('0'),
    ...shorthands.margin('0'),
    width: '100%',
    maxWidth: '100%',
  },
  dialogBody: {
    ...shorthands.padding('0'),
    overflowY: 'auto',
    maxHeight: '65vh',
  },
  sheetHandle: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('8px', '0', '4px'),
  },
  sheetHandleBar: {
    width: '36px',
    height: '4px',
    ...shorthands.borderRadius('2px'),
    backgroundColor: tokens.colorNeutralStroke2,
  },
});

interface IMobileBottomNavProps {
  selectedProject: ISelectedProject | null;
  onSelectProject: (project: ISelectedProject | null) => void;
}

export const MobileBottomNav: React.FC<IMobileBottomNavProps> = ({ selectedProject, onSelectProject }) => {
  const styles = useStyles();
  const location = useAppLocation();
  const navigate = useAppNavigate();
  const { currentUser } = useAppContext();
  const [isPickerSheetOpen, setIsPickerSheetOpen] = React.useState(false);
  const userRoles = currentUser?.roles ?? [];

  const activeWorkspaceId = getWorkspaceFromPath(location.pathname);

  const isWorkspaceVisible = React.useCallback((ws: IWorkspaceDefinition): boolean => {
    return ws.requiredGroupKeys.some((key: string) => {
      const allowed = NAV_GROUP_ROLES[key];
      return allowed && userRoles.some(r => allowed.includes(r));
    });
  }, [userRoles]);

  const handleTabClick = React.useCallback((basePath: string) => {
    navigate(basePath);
  }, [navigate]);

  const handlePickerSelect = React.useCallback((project: ISelectedProject | null) => {
    setIsPickerSheetOpen(false);
    onSelectProject(project);
  }, [onSelectProject]);

  return (
    <>
      <div className={styles.bar} role="navigation" aria-label="Quick navigation">
        <div role="tablist" aria-label="Workspace navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
          {LAUNCHER_WORKSPACES.filter(isWorkspaceVisible).map(ws => (
            <button
              key={ws.id}
              role="tab"
              aria-selected={ws.id === activeWorkspaceId}
              className={mergeClasses(styles.tab, ws.id === activeWorkspaceId && styles.tabActive)}
              onClick={() => handleTabClick(ws.basePath)}
            >
              <span className={styles.tabIcon}>{ws.iconName === 'hub' ? '\u2302' : ws.label.charAt(0)}</span>
              {ws.label}
            </button>
          ))}
          <button
            className={styles.projectPill}
            onClick={() => setIsPickerSheetOpen(true)}
            aria-label={selectedProject ? `Current project: ${selectedProject.projectName}` : 'Select a project'}
          >
            <span className={styles.projectPillText}>
              {selectedProject?.projectCode ?? '...'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom-sheet project picker */}
      <Dialog
        open={isPickerSheetOpen}
        onOpenChange={(_, data) => setIsPickerSheetOpen(data.open)}
        modalType="modal"
      >
        <DialogSurface className={styles.dialogSurface}>
          <div className={styles.sheetHandle}>
            <div className={styles.sheetHandleBar} />
          </div>
          <DialogBody className={styles.dialogBody}>
            <EnhancedProjectPicker
              selected={selectedProject}
              onSelect={handlePickerSelect}
            />
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
