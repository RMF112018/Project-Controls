import * as React from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAppContext, ISelectedProject } from '../contexts/AppContext';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { Stage, getStageLabel, isActiveStage } from '@hbc/sp-services';

interface IProjectPickerProps {
  selected: ISelectedProject | null;
  onSelect: (project: ISelectedProject | null) => void;
  locked?: boolean;
}

export const ProjectPicker: React.FC<IProjectPickerProps> = ({ selected, onSelect, locked }) => {
  const { leads, fetchLeads } = useLeads();
  const { dataService, currentUser, resolvedPermissions } = useAppContext();
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [accessibleCodes, setAccessibleCodes] = React.useState<string[] | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

  // Load accessible project codes when permission engine is active
  React.useEffect(() => {
    if (!currentUser || !resolvedPermissions) {
      setAccessibleCodes(null);
      return;
    }
    // If user has globalAccess, show all projects
    if (resolvedPermissions.globalAccess) {
      setAccessibleCodes(null);
      return;
    }
    // Otherwise fetch the user's accessible projects
    dataService.getAccessibleProjects(currentUser.email)
      .then(codes => setAccessibleCodes(codes))
      .catch(() => setAccessibleCodes(null));
  }, [currentUser, resolvedPermissions, dataService]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Map leads to selectable projects (only those with project codes)
  const projects: ISelectedProject[] = React.useMemo(() => {
    let filteredLeads = leads
      .filter(l => l.ProjectCode && isActiveStage(l.Stage));

    // If accessibleCodes is set, filter to only those project codes
    if (accessibleCodes !== null) {
      const codeSet = new Set(accessibleCodes.map(c => c.toLowerCase()));
      filteredLeads = filteredLeads.filter(l => l.ProjectCode && codeSet.has(l.ProjectCode.toLowerCase()));
    }

    return filteredLeads.map(l => ({
      projectCode: l.ProjectCode!,
      projectName: l.Title,
      stage: l.Stage,
      region: l.Region,
      division: l.Division,
      leadId: l.id,
    }));
  }, [leads, accessibleCodes]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q)
    );
  }, [projects, query]);

  // Group by stage
  const grouped = React.useMemo(() => {
    const groups: Record<string, ISelectedProject[]> = {};
    filtered.forEach(p => {
      const key = p.stage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered]);

  const stageOrder = [
    Stage.ActiveConstruction,
    Stage.Pursuit,
    Stage.WonContractPending,
    Stage.Opportunity,
    Stage.Closeout,
  ];

  const handleSelect = (project: ISelectedProject): void => {
    setIsOpen(false);
    setQuery('');
    React.startTransition(() => onSelect(project));
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setQuery('');
    React.startTransition(() => onSelect(null));
  };

  if (locked && selected) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 6,
          border: `1px solid ${HBC_COLORS.gray200}`,
          backgroundColor: HBC_COLORS.gray50,
          fontSize: 13, minHeight: 32,
        }}>
          <span style={{ flex: 1, fontWeight: 500, color: HBC_COLORS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.projectName}
          </span>
            <span style={{ color: HBC_COLORS.gray600, fontSize: 11 }}>{selected.projectCode}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', padding: '8px 12px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '6px',
          border: `1px solid ${isOpen ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '13px',
          minHeight: '32px',
        }}
      >
        {selected ? (
          <>
            <span style={{ flex: 1, fontWeight: 500, color: HBC_COLORS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.projectName}
            </span>
            <span
              onClick={handleClear}
              style={{ color: HBC_COLORS.gray600, cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              title="Clear selection"
            >
              &times;
            </span>
          </>
        ) : (
          <span style={{ flex: 1, color: HBC_COLORS.gray600 }}>Select a project...</span>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: '#fff',
          border: `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '6px',
          boxShadow: ELEVATION.level3,
          maxHeight: '320px',
          overflow: 'auto',
        }}>
          <div style={{ padding: '8px', borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects..."
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${HBC_COLORS.gray300}`,
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: HBC_COLORS.gray600, fontSize: '13px' }}>
              {accessibleCodes !== null && accessibleCodes.length === 0
                ? 'No projects assigned to you'
                : 'No matching projects'}
            </div>
          ) : (
            stageOrder
              .filter(stage => grouped[stage] && grouped[stage].length > 0)
              .map(stage => (
                <div key={stage}>
                  <div style={{
                    padding: '6px 12px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: HBC_COLORS.gray600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: HBC_COLORS.gray50,
                    borderBottom: `1px solid ${HBC_COLORS.gray200}`,
                  }}>
                    {getStageLabel(stage)}
                  </div>
                  {grouped[stage].map(p => (
                    <div
                      key={p.projectCode}
                      onClick={() => handleSelect(p)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: selected?.projectCode === p.projectCode ? HBC_COLORS.gray100 : 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = HBC_COLORS.gray50)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = selected?.projectCode === p.projectCode ? HBC_COLORS.gray100 : 'transparent')}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{p.projectName}</span>
                        <span style={{ color: HBC_COLORS.gray600, marginLeft: '6px' }}>{p.projectCode}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};
