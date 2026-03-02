import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { FolderOpen24Regular } from '@fluentui/react-icons';
import type { ISelectedProject } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';

export interface IProjectSelectorProps {
  /** Callback when user picks a project from the embedded picker. */
  onProjectSelected?: (project: ISelectedProject) => void;
  /** Override the default "No Project Selected" title. */
  title?: string;
  /** Override the default description text. */
  description?: string;
  /** Content to render when a project IS selected (guard pattern). */
  children?: React.ReactNode;
  /** Optional className for the root container. */
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    justifyItems: 'center',
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  icon: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    maxInlineSize: '56ch',
  },
  pickerContainer: {
    minWidth: '320px',
    maxWidth: '480px',
    width: '100%',
  },
});

const ProjectSelectorInner: React.FC<IProjectSelectorProps> = ({
  onProjectSelected,
  title = 'No Project Selected',
  description = 'Select a project from the picker below to continue.',
  children,
  className,
}) => {
  const styles = useStyles();
  const { selectedProject, setSelectedProject } = useAppContext();

  const handleSelect = React.useCallback(
    (project: ISelectedProject | null) => {
      if (project) {
        setSelectedProject(project);
        onProjectSelected?.(project);
      }
    },
    [setSelectedProject, onProjectSelected],
  );

  // Guard pattern: when a project IS selected, render children
  if (selectedProject) {
    return <>{children ?? null}</>;
  }

  return (
    <section
      className={mergeClasses(styles.root, className)}
      aria-live="polite"
      aria-label={title}
      role="status"
    >
      <div className={styles.icon} aria-hidden="true">
        <FolderOpen24Regular />
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      <div className={styles.pickerContainer}>
        <ProjectPicker
          selected={null}
          onSelect={handleSelect}
        />
      </div>
    </section>
  );
};

ProjectSelectorInner.displayName = 'ProjectSelector';

export const ProjectSelector = React.memo(ProjectSelectorInner);
