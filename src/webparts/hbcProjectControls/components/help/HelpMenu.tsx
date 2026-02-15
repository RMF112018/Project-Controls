import * as React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  makeStyles,
} from '@fluentui/react-components';
import {
  QuestionCircleRegular,
  LightbulbRegular,
  BookOpenRegular,
  LibraryRegular,
  PersonSupportRegular,
} from '@fluentui/react-icons';
import { useHelp } from '../contexts/HelpContext';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  triggerButton: {
    color: '#fff',
    backgroundColor: 'transparent',
    minWidth: 'unset',
    ':hover': {
      color: HBC_COLORS.orange,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
});

export const HelpMenu: React.FC = () => {
  const styles = useStyles();
  const { openHelpPanel, startTour, currentModuleKey, openContactSupport } = useHelp();

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance="transparent"
          size="small"
          icon={<QuestionCircleRegular />}
          className={styles.triggerButton}
          aria-label="Help menu"
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem
            icon={<LightbulbRegular />}
            onClick={() => startTour(currentModuleKey ?? undefined)}
            disabled={!currentModuleKey}
          >
            Start Guided Tour
          </MenuItem>
          <MenuItem
            icon={<BookOpenRegular />}
            onClick={() => openHelpPanel('targeted')}
            disabled={!currentModuleKey}
          >
            How-To Guides for This Page
          </MenuItem>
          <MenuItem icon={<LibraryRegular />} onClick={() => openHelpPanel('library')}>
            Full Help Library
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<PersonSupportRegular />} onClick={() => openContactSupport()}>
            Contact Support
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
