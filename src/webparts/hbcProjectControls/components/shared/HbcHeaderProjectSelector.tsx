/**
 * HBC-PC-NAV-001 / HBC-PC-UUID-001 — HbcHeaderProjectSelector
 *
 * Procore-style persistent project selector in the AppShell header.
 * Searchable Fluent UI v9 Combobox backed by dataService.getLeads().
 * Gated on `ProjectUuidNavigation` feature flag.
 *
 * Selecting a project calls `useCurrentProject().setCurrentProject(uuid)`,
 * which updates both URL search params and AppContext.
 */
import * as React from 'react';
import {
  Combobox,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { ComboboxProps } from '@fluentui/react-components';
import { BuildingMultiple24Regular } from '@fluentui/react-icons';
import { useAppContext } from '../contexts/AppContext';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { isActiveStage, getStageLabel } from '@hbc/sp-services';
import type { ILead, ISelectedProject } from '@hbc/sp-services';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  combobox: {
    minWidth: '200px',
    maxWidth: '320px',
  },
  iconOnly: {
    minWidth: 'auto',
    width: '32px',
  },
  stageLabel: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
});

interface IProjectOption {
  uuid: string;
  projectCode: string;
  projectName: string;
  stage: string;
  stageLabel: string;
  leadId: number;
}

export const HbcHeaderProjectSelector: React.FC = React.memo(() => {
  const styles = useStyles();
  const { dataService, currentUser, resolvedPermissions } = useAppContext();
  const { selectedProject, setCurrentProject } = useCurrentProject();

  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [accessibleCodes, setAccessibleCodes] = React.useState<string[] | null>(null);

  // Fetch leads (staleTime handled at query level; this is a one-time mount fetch)
  React.useEffect(() => {
    dataService.getLeads()
      .then(result => setLeads(result.items))
      .catch(() => setLeads([]));
  }, [dataService]);

  // Load accessible project codes when permission engine is active
  React.useEffect(() => {
    if (!currentUser || !resolvedPermissions) {
      setAccessibleCodes(null);
      return;
    }
    if (resolvedPermissions.globalAccess) {
      setAccessibleCodes(null);
      return;
    }
    dataService.getAccessibleProjects(currentUser.email)
      .then(codes => setAccessibleCodes(codes))
      .catch(() => setAccessibleCodes(null));
  }, [currentUser, resolvedPermissions, dataService]);

  const options: IProjectOption[] = React.useMemo(() => {
    let filtered = leads.filter(l => l.ProjectCode && l.projectUuid && isActiveStage(l.Stage));

    if (accessibleCodes !== null) {
      const codeSet = new Set(accessibleCodes.map(c => c.toLowerCase()));
      filtered = filtered.filter(l => l.ProjectCode && codeSet.has(l.ProjectCode.toLowerCase()));
    }

    return filtered.map(l => ({
      uuid: l.projectUuid!,
      projectCode: l.ProjectCode!,
      projectName: l.Title,
      stage: l.Stage,
      stageLabel: getStageLabel(l.Stage),
      leadId: l.id,
    }));
  }, [leads, accessibleCodes]);

  const handleOptionSelect: ComboboxProps['onOptionSelect'] = React.useCallback(
    (_ev, data) => {
      const selected = options.find(o => o.uuid === data.optionValue);
      if (selected) {
        setCurrentProject(selected.uuid);
      } else if (!data.optionValue) {
        setCurrentProject(null);
      }
    },
    [options, setCurrentProject],
  );

  const selectedValue = React.useMemo(() => {
    if (!selectedProject?.projectUuid) return '';
    const match = options.find(o => o.uuid === selectedProject.projectUuid);
    return match ? `${match.projectName} (${match.projectCode})` : selectedProject.projectName || '';
  }, [selectedProject, options]);

  return (
    <div
      className={styles.root}
      data-print-hide
      aria-label="Project selector"
    >
      <BuildingMultiple24Regular aria-hidden="true" />
      <Combobox
        className={styles.combobox}
        placeholder="Select project..."
        value={selectedValue}
        selectedOptions={selectedProject?.projectUuid ? [selectedProject.projectUuid] : []}
        onOptionSelect={handleOptionSelect}
        aria-label="Select project"
        freeform={false}
        clearable
        size="small"
      >
        {options.map(opt => (
          <Option
            key={opt.uuid}
            value={opt.uuid}
            text={`${opt.projectName} (${opt.projectCode})`}
          >
            <span>{opt.projectName}</span>
            {' '}
            <span className={styles.stageLabel}>
              {opt.projectCode} &middot; {opt.stageLabel}
            </span>
          </Option>
        ))}
      </Combobox>
    </div>
  );
});

HbcHeaderProjectSelector.displayName = 'HbcHeaderProjectSelector';
