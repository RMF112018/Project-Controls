import * as React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemRadio,
  MenuGroup,
  MenuGroupHeader,
  MenuDivider,
  Badge,
  Button,
  Persona,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { InfoRegular } from '@fluentui/react-icons';
import { useAppContext } from '../contexts/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { APP_VERSION } from '@hbc/sp-services';
import { HBC_COLORS } from '../../theme/tokens';

export interface IHeaderUserMenuProps {
  onWhatsNew: () => void;
}

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  triggerButton: {
    backgroundColor: 'transparent',
    ...shorthands.border('0'),
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    minWidth: 'auto',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
  modeBadgeMock: {
    fontSize: '10px',
    fontWeight: 700 as unknown as string,
    letterSpacing: '0.5px',
    backgroundColor: '#ffd700',
    color: HBC_COLORS.navy,
  },
  modeBadgeLive: {
    fontSize: '10px',
    fontWeight: 700 as unknown as string,
    letterSpacing: '0.5px',
    backgroundColor: '#50fa7b',
    color: HBC_COLORS.navy,
  },
  userSection: {
    ...shorthands.padding('8px', '12px'),
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  userEmail: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  versionItem: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  displayName: {
    fontSize: '13px',
    opacity: 0.9,
    color: '#fff',
  },
});

export const HeaderUserMenu: React.FC<IHeaderUserMenuProps> = ({ onWhatsNew }) => {
  const styles = useStyles();
  const { currentUser, dataServiceMode, devToolsConfig } = useAppContext();
  const { isMobile } = useResponsive();
  const isMockMode = dataServiceMode === 'mock';
  const isStandaloneMode = dataServiceMode === 'standalone';
  const hasDevTools = !!devToolsConfig;

  const secondaryText = React.useMemo(() => {
    if (hasDevTools && devToolsConfig) {
      const roleName = devToolsConfig.roleOptions.find(
        r => r.value === devToolsConfig.currentRole
      )?.label ?? devToolsConfig.currentRole;
      return `${roleName} \u2022 DEV`;
    }
    return `v${APP_VERSION}`;
  }, [hasDevTools, devToolsConfig]);

  const handleCheckedValueChange = React.useCallback(
    (_e: unknown, data: { name: string; checkedItems: string[] }) => {
      if (data.name === 'devRole' && data.checkedItems.length > 0 && devToolsConfig) {
        devToolsConfig.onRoleChange(data.checkedItems[0]);
      }
    },
    [devToolsConfig]
  );

  return (
    <div data-testid="role-switcher" className={styles.wrapper}>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            appearance="transparent"
            className={styles.triggerButton}
          >
            <Persona
              name={currentUser?.displayName ?? 'User'}
              secondaryText={!isMobile ? secondaryText : undefined}
              presence={{ status: 'available' }}
              size="small"
              avatar={{ color: 'colorful' }}
              textPosition={isMobile ? 'after' : 'after'}
            />
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList
            checkedValues={devToolsConfig ? { devRole: [devToolsConfig.currentRole] } : undefined}
            onCheckedValueChange={handleCheckedValueChange}
          >
            {/* User info */}
            <div className={styles.userSection}>
              <div className={styles.userName}>{currentUser?.displayName ?? 'User'}</div>
              {currentUser?.email && (
                <div className={styles.userEmail}>{currentUser.email}</div>
              )}
            </div>

            <MenuDivider />

            {/* Version / What's New */}
            <MenuItem icon={<InfoRegular />} onClick={onWhatsNew}>
              {"What's New (v" + APP_VERSION + ")"}
            </MenuItem>

            {/* Dev tools section — only in dev modes with config */}
            {hasDevTools && devToolsConfig && isMockMode && (
              <>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>Development Tools</MenuGroupHeader>
                  {devToolsConfig.roleOptions.map(({ label, value }) => (
                    <MenuItemRadio key={label} name="devRole" value={value}>
                      {label}
                    </MenuItemRadio>
                  ))}
                </MenuGroup>
              </>
            )}

            {/* Mode switching */}
            {hasDevTools && devToolsConfig?.onSwitchMode && (
              <>
                <MenuDivider />
                {isMockMode && (
                  <MenuItem onClick={devToolsConfig.onSwitchMode}>
                    Login (Real Data)
                  </MenuItem>
                )}
                {isStandaloneMode && (
                  <MenuItem onClick={devToolsConfig.onSwitchMode}>
                    Return to Mock Mode
                  </MenuItem>
                )}
              </>
            )}
          </MenuList>
        </MenuPopover>
      </Menu>

      {/* Visible mode badge — no menu open required (Playwright mode-switch.spec.ts) */}
      {hasDevTools && isMockMode && (
        <Badge appearance="filled" size="small" className={styles.modeBadgeMock}>
          MOCK MODE
        </Badge>
      )}
      {hasDevTools && isStandaloneMode && (
        <Badge appearance="filled" size="small" className={styles.modeBadgeLive}>
          LIVE DATA
        </Badge>
      )}
    </div>
  );
};
