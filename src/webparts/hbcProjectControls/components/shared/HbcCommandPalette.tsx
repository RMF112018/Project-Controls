import * as React from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import type { RoleName } from '@hbc/sp-services';
import type { IAppContextValue } from '../contexts/AppContext';
import { useAppContext } from '../contexts/AppContext';

export interface IHbcCommandPaletteCommand {
  id: string;
  label: string;
  keywords?: string[];
  section?: string;
  icon?: React.ReactNode;
  run: () => void;
  requiredPermissions?: string[];
  requiredRoles?: RoleName[];
  requiredFeatureFlags?: string[];
  isVisible?: (ctx: IAppContextValue) => boolean;
}

export interface IHbcCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: IHbcCommandPaletteCommand[];
  placeholder?: string;
  emptyState?: React.ReactNode;
}

const useStyles = makeStyles({
  surface: {
    inlineSize: 'min(680px, calc(100vw - 2 * 24px))',
    maxBlockSize: 'min(80vh, 720px)',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow64,
  },
  body: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  input: {
    inlineSize: '100%',
  },
  list: {
    maxBlockSize: 'min(55vh, 480px)',
    overflowY: 'auto',
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalNone),
  },
  option: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    textAlign: 'left',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: tokens.strokeWidthThin,
    },
  },
  optionActive: {
    backgroundColor: tokens.colorSubtleBackgroundPressed,
    ...shorthands.borderColor(tokens.colorBrandStroke1),
  },
  optionLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    fontWeight: tokens.fontWeightSemibold,
  },
  optionMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  sectionDivider: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBlockStart: tokens.spacingVerticalXS,
  },
  kbdHint: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding('2px', '6px'),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    fontFamily: 'inherit',
  },
  empty: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(command: IHbcCommandPaletteCommand, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeValue(query);
  const haystack = [command.label, ...(command.keywords ?? [])]
    .join(' ')
    .toLowerCase();

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  return queryTokens.every((token) => haystack.includes(token));
}

function isCommandAllowed(command: IHbcCommandPaletteCommand, context: IAppContextValue): boolean {
  const { currentUser, hasPermission, isFeatureEnabled } = context;

  const permissionsAllowed = (command.requiredPermissions ?? []).every((permission) => hasPermission(permission));
  if (!permissionsAllowed) {
    return false;
  }

  const requiredRoles = command.requiredRoles ?? [];
  if (requiredRoles.length > 0) {
    const userRoles = currentUser?.roles ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return false;
    }
  }

  const featuresAllowed = (command.requiredFeatureFlags ?? []).every((flag) => isFeatureEnabled(flag));
  if (!featuresAllowed) {
    return false;
  }

  if (command.isVisible && !command.isVisible(context)) {
    return false;
  }

  return true;
}

export const HbcCommandPalette: React.FC<IHbcCommandPaletteProps> = ({
  open,
  onOpenChange,
  commands,
  placeholder = 'Search commands',
  emptyState,
}) => {
  const styles = useStyles();
  const context = useAppContext();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const visibleCommands = React.useMemo(() => (
    commands
      .filter((command) => isCommandAllowed(command, context))
      .filter((command) => matchesQuery(command, query))
  ), [commands, context, query]);

  React.useEffect(() => {
    if (activeIndex >= visibleCommands.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, visibleCommands.length]);

  const activeCommandId = visibleCommands[activeIndex] ? `hbc-command-${visibleCommands[activeIndex].id}` : undefined;

  const runCommand = React.useCallback((command: IHbcCommandPaletteCommand): void => {
    command.run();
    onOpenChange(false);
  }, [onOpenChange]);

  const onInputKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (visibleCommands.length === 0 ? 0 : (index + 1) % visibleCommands.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (visibleCommands.length === 0 ? 0 : (index - 1 + visibleCommands.length) % visibleCommands.length));
      return;
    }

    if (event.key === 'Enter' && visibleCommands[activeIndex]) {
      event.preventDefault();
      runCommand(visibleCommands[activeIndex]);
    }
  }, [activeIndex, runCommand, visibleCommands]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface} aria-label="Command palette">
        <DialogBody className={styles.body}>
          <DialogTitle>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Command Palette
              <span className={styles.kbdHint} aria-hidden="true">Ctrl+K</span>
            </span>
          </DialogTitle>
          <DialogContent>
            <Input
              autoFocus
              className={styles.input}
              value={query}
              onChange={(_, data) => setQuery(data.value)}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder}
              aria-label="Command search"
              aria-controls="hbc-command-list"
              aria-activedescendant={activeCommandId}
              role="combobox"
            />
            <div id="hbc-command-list" className={styles.list} role="listbox" aria-label="Available commands">
              {visibleCommands.length === 0 ? (
                <div className={styles.empty}>{emptyState ?? 'No commands match your search.'}</div>
              ) : (
                visibleCommands.map((command, index) => {
                  const prevSection = index > 0 ? visibleCommands[index - 1].section : undefined;
                  const showSectionHeader = command.section && command.section !== prevSection;
                  return (
                    <React.Fragment key={command.id}>
                      {showSectionHeader && (
                        <div className={styles.sectionDivider} role="separator">
                          {command.section}
                        </div>
                      )}
                      <button
                        id={`hbc-command-${command.id}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        className={mergeClasses(styles.option, index === activeIndex ? styles.optionActive : undefined)}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => runCommand(command)}
                      >
                        <span className={styles.optionLabel}>
                          {command.icon}
                          {command.label}
                        </span>
                        {command.section ? <span className={styles.optionMeta}>{command.section}</span> : null}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default HbcCommandPalette;
