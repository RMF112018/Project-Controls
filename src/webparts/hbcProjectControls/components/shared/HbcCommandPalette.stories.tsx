import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { RoleName } from '@hbc/sp-services';
import { HbcButton } from './HbcButton';
import { HbcCommandPalette, type IHbcCommandPaletteCommand } from './HbcCommandPalette';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    justifyItems: 'start',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  note: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

const baseCommands: IHbcCommandPaletteCommand[] = [
  {
    id: 'open-whats-new',
    label: 'Open What\'s New',
    keywords: ['release', 'notes', 'version'],
    section: 'Help',
    run: () => undefined,
  },
  {
    id: 'toggle-full-screen',
    label: 'Toggle Full Screen',
    keywords: ['focus', 'layout'],
    section: 'View',
    run: () => undefined,
  },
  {
    id: 'open-admin-panel',
    label: 'Open Admin Panel',
    keywords: ['admin', 'permissions'],
    section: 'Administration',
    requiredRoles: [RoleName.SharePointAdmin],
    run: () => undefined,
  },
  {
    id: 'open-help-tour',
    label: 'Start Guided Tour',
    keywords: ['guide', 'help', 'tour'],
    section: 'Help',
    requiredFeatureFlags: ['EnableHelpSystem'],
    run: () => undefined,
  },
];

const Launcher: React.FC<{ commands: IHbcCommandPaletteCommand[]; initiallyOpen?: boolean }> = ({ commands, initiallyOpen = false }) => {
  const styles = useStyles();
  const [open, setOpen] = React.useState(initiallyOpen);

  return (
    <div className={styles.root}>
      <HbcButton emphasis="strong" onClick={() => setOpen(true)}>Open Command Palette</HbcButton>
      <div className={styles.note}>Use arrow keys and Enter to execute a command.</div>
      <HbcCommandPalette open={open} onOpenChange={setOpen} commands={commands} />
    </div>
  );
};

const meta: Meta<typeof HbcCommandPalette> = {
  title: 'Shared/HbcCommandPalette',
  component: HbcCommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: () => React.createElement(Launcher, { commands: baseCommands }),
};

export default meta;
type Story = StoryObj<typeof HbcCommandPalette>;

export const Default: Story = {};

export const FilteredResults: Story = {
  render: () => React.createElement(Launcher, {
    commands: [
      ...baseCommands,
      {
        id: 'pipeline-view',
        label: 'Open Pipeline View',
        keywords: ['pipeline', 'hub'],
        section: 'Navigation',
        run: () => undefined,
      },
    ],
    initiallyOpen: true,
  }),
};

export const NoResults: Story = {
  render: () => React.createElement(Launcher, {
    commands: [
      {
        id: 'only-command',
        label: 'Compliance Dashboard',
        keywords: ['compliance'],
        section: 'Navigation',
        run: () => undefined,
      },
    ],
    initiallyOpen: true,
  }),
};

export const RoleGatedCommands: Story = {
  render: () => React.createElement(Launcher, {
    commands: baseCommands,
    initiallyOpen: true,
  }),
};

export const FeatureFlagGatedCommands: Story = {
  render: () => React.createElement(Launcher, {
    commands: baseCommands,
    initiallyOpen: true,
  }),
};
