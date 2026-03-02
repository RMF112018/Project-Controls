import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import type { ISelectedProject } from '@hbc/sp-services';
import { ProjectSelector } from './ProjectSelector';
import { useToast } from '../shared/ToastContainer';
import { useHbcMotionStyles } from '../shared/HbcMotion';

export interface IProjectRequiredGuardProps {
  /** Page title used in the success toast (e.g. "BD Project Hub"). */
  pageTitle?: string;
  /** Override ProjectSelector description text. */
  description?: string;
  /** Show success toast on project selection. Default: true. */
  showToast?: boolean;
  /** Content to render when a project IS selected. */
  children: React.ReactNode;
  /** Optional className for the ProjectSelector root. */
  className?: string;
}

const ProjectRequiredGuardInner: React.FC<IProjectRequiredGuardProps> = ({
  pageTitle = 'Project',
  description,
  showToast = true,
  children,
  className,
}) => {
  const { addToast } = useToast();
  const motionStyles = useHbcMotionStyles();

  const handleProjectSelected = React.useCallback(
    (project: ISelectedProject) => {
      if (showToast) {
        addToast(
          `Loaded ${project.projectName} \u2014 ${pageTitle}`,
          'success',
          4000,
        );
      }
    },
    [addToast, showToast, pageTitle],
  );

  return (
    <ProjectSelector
      description={description}
      onProjectSelected={handleProjectSelected}
      className={className}
    >
      <div className={mergeClasses(motionStyles.routeTransition, motionStyles.reducedMotion)}>
        {children}
      </div>
    </ProjectSelector>
  );
};

ProjectRequiredGuardInner.displayName = 'ProjectRequiredGuard';

export const ProjectRequiredGuard = React.memo(ProjectRequiredGuardInner);
