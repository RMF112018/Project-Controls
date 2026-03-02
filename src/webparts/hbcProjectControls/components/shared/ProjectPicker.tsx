import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { tokens } from '@fluentui/react-components';
import { ELEVATION } from '../../theme/tokens';
import { Stage, getStageLabel, isActiveStage, ILead, type ISelectedProject } from '@hbc/sp-services';

interface IProjectPickerProps {
  selected: ISelectedProject | null;
  onSelect: (project: ISelectedProject | null) => void;
  locked?: boolean;
}

const LISTBOX_ID = 'project-picker-listbox';

export const ProjectPicker: React.FC<IProjectPickerProps> = ({ selected, onSelect, locked }) => {
  const { dataService, currentUser, resolvedPermissions } = useAppContext();
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [accessibleCodes, setAccessibleCodes] = React.useState<string[] | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch leads directly from data service
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

  const projects: ISelectedProject[] = React.useMemo(() => {
    let filteredLeads = leads
      .filter((l: ILead) => l.ProjectCode && isActiveStage(l.Stage));

    if (accessibleCodes !== null) {
      const codeSet = new Set(accessibleCodes.map(c => c.toLowerCase()));
      filteredLeads = filteredLeads.filter((l: ILead) => l.ProjectCode && codeSet.has(l.ProjectCode.toLowerCase()));
    }

    return filteredLeads.map((l: ILead) => ({
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

  // Flat ordered list matching grouped render order — used for keyboard navigation
  const flatItems = React.useMemo(() => {
    const items: ISelectedProject[] = [];
    stageOrder.forEach(stage => {
      if (grouped[stage]) items.push(...grouped[stage]);
    });
    return items;
  }, [grouped]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset highlighted index when filtered results change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0) {
      document.getElementById(`project-option-${highlightedIndex}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleSelect = React.useCallback((project: ISelectedProject): void => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    React.startTransition(() => onSelect(project));
  }, [onSelect]);

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setQuery('');
    React.startTransition(() => onSelect(null));
  };

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const count = flatItems.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!count) return;
        setHighlightedIndex(prev => (prev + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!count) return;
        setHighlightedIndex(prev => (prev - 1 + count) % count);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < count) {
          handleSelect(flatItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [flatItems, highlightedIndex, handleSelect]);

  const activeDescendant = highlightedIndex >= 0 ? `project-option-${highlightedIndex}` : undefined;

  if (locked && selected) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 6,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          backgroundColor: tokens.colorNeutralBackground2,
          fontSize: 13, minHeight: 32,
        }}>
          <span style={{ flex: 1, fontWeight: 500, color: tokens.colorBrandForeground1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.projectName}
          </span>
            <span style={{ color: tokens.colorNeutralForeground2, fontSize: 11 }}>{selected.projectCode}</span>
        </div>
      </div>
    );
  }

  // Build a flat index counter for rendering to map grouped items to flat indices
  let flatIndex = 0;

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
          border: `1px solid ${isOpen ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '13px',
          minHeight: '32px',
        }}
      >
        {selected ? (
          <>
            <span style={{ flex: 1, fontWeight: 500, color: tokens.colorBrandForeground1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.projectName}
            </span>
            <span
              onClick={handleClear}
              style={{ color: tokens.colorNeutralForeground2, cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              title="Clear selection"
              role="button"
              aria-label="Clear project selection"
            >
              &times;
            </span>
          </>
        ) : (
          <span style={{ flex: 1, color: tokens.colorNeutralForeground2 }}>Select a project...</span>
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
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          borderRadius: '6px',
          boxShadow: ELEVATION.level3,
          maxHeight: '320px',
          overflow: 'auto',
        }}>
          <div style={{ padding: '8px', borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects..."
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={LISTBOX_ID}
              aria-activedescendant={activeDescendant}
              aria-autocomplete="list"
              aria-label="Search projects"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: tokens.colorNeutralForeground2, fontSize: '13px' }} role="status">
              {accessibleCodes !== null && accessibleCodes.length === 0
                ? 'No projects assigned to you'
                : 'No matching projects'}
            </div>
          ) : (
            <div role="listbox" id={LISTBOX_ID} aria-label="Project list">
              {stageOrder
                .filter(stage => grouped[stage] && grouped[stage].length > 0)
                .map(stage => (
                  <div key={stage} role="group" aria-label={getStageLabel(stage)}>
                    <div style={{
                      padding: '6px 12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: tokens.colorNeutralForeground2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
                    }} role="presentation">
                      {getStageLabel(stage)}
                    </div>
                    {grouped[stage].map(p => {
                      const itemIndex = flatIndex++;
                      const isHighlighted = itemIndex === highlightedIndex;
                      const isSelected = selected?.projectCode === p.projectCode;
                      return (
                        <div
                          key={p.projectCode}
                          id={`project-option-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(p)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: isHighlighted
                              ? tokens.colorNeutralBackground1Selected
                              : isSelected
                                ? tokens.colorNeutralBackground3
                                : 'transparent',
                            outline: isHighlighted ? `2px solid ${tokens.colorBrandStroke1}` : 'none',
                            outlineOffset: '-2px',
                          }}
                          onMouseEnter={e => {
                            if (!isHighlighted) e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground2;
                            setHighlightedIndex(itemIndex);
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = isSelected ? tokens.colorNeutralBackground3 : 'transparent';
                          }}
                        >
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 500, color: tokens.colorBrandForeground1 }}>{p.projectName}</span>
                            <span style={{ color: tokens.colorNeutralForeground2, marginLeft: '6px' }}>{p.projectCode}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
