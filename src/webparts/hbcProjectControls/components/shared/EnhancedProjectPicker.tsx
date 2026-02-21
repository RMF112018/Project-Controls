import * as React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverSurface,
  makeStyles,
  shorthands,
  tokens,
  mergeClasses,
  Input,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Star24Regular,
  Star24Filled,
  MoreHorizontal20Regular,
  Dismiss16Regular,
  Search20Regular,
} from '@fluentui/react-icons';
import { useLeads } from '../hooks/useLeads';
import { useAppContext, ISelectedProject } from '../contexts/AppContext';
import { useNavProfile } from '../hooks/useNavProfile';
import { fuzzyScore, fuzzyHighlight } from '../utils/fuzzyScore';
import { StageBadge } from './StageBadge';
import { ProjectPreviewPane } from './ProjectPreviewPane';
import { Stage, getStageLabel, isActiveStage } from '@hbc/sp-services';
import { HBC_COLORS, SPACING, TOUCH_TARGET } from '../../theme/tokens';
import { useAppNavigate } from '../hooks/router/useAppNavigate';

const useStyles = makeStyles({
  trigger: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('6px', '10px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray300),
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '32px',
    width: '100%',
    boxSizing: 'border-box',
    transitionProperty: 'border-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      ...shorthands.borderColor(HBC_COLORS.navy),
    },
  },
  triggerOpen: {
    ...shorthands.borderColor(HBC_COLORS.navy),
  },
  triggerText: {
    flex: 1,
    fontWeight: '500',
    color: HBC_COLORS.navy,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  triggerPlaceholder: {
    flex: 1,
    color: HBC_COLORS.gray400,
  },
  clearBtn: {
    color: HBC_COLORS.gray400,
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: HBC_COLORS.gray600,
    },
  },
  surface: {
    width: '380px',
    maxHeight: '480px',
    ...shorthands.padding('0'),
    ...shorthands.overflow('hidden'),
    display: 'flex',
    flexDirection: 'column',
  },
  searchSection: {
    ...shorthands.padding(SPACING.sm),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  contentArea: {
    overflowY: 'auto',
    flex: 1,
  },
  sectionHeader: {
    ...shorthands.padding('8px', '12px', '4px'),
    fontSize: '10px',
    fontWeight: '700',
    color: HBC_COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  recentChips: {
    display: 'flex',
    ...shorthands.gap('6px'),
    ...shorthands.padding('4px', '12px', '8px'),
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': { display: 'none' },
  },
  recentChip: {
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('14px'),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: '12px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    ...shorthands.border('1px', 'solid', 'transparent'),
    transitionProperty: 'background-color, border-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  projectRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '12px'),
    cursor: 'pointer',
    fontSize: '13px',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '-2px',
    },
  },
  projectRowSelected: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  projectInfo: {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
  },
  projectName: {
    fontWeight: '500',
    color: HBC_COLORS.navy,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectCode: {
    fontSize: '11px',
    color: HBC_COLORS.gray400,
  },
  starBtn: {
    minWidth: TOUCH_TARGET.min,
    minHeight: TOUCH_TARGET.min,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    fontWeight: '600',
  },
  stageGroupHeader: {
    ...shorthands.padding('6px', '12px'),
    fontSize: '10px',
    fontWeight: '700',
    color: HBC_COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  emptyState: {
    ...shorthands.padding(SPACING.lg),
    textAlign: 'center',
    color: HBC_COLORS.gray400,
    fontSize: '13px',
  },
  previewContainer: {
    display: 'flex',
    ...shorthands.gap('4px'),
  },
  moreBtn: {
    minWidth: '28px',
    minHeight: '28px',
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    marginBlockStart: '4px',
    marginBlockEnd: '4px',
  },
});

const STAGE_ORDER = [
  Stage.ActiveConstruction,
  Stage.Pursuit,
  Stage.WonContractPending,
  Stage.Opportunity,
  Stage.Closeout,
];

interface IEnhancedProjectPickerProps {
  selected: ISelectedProject | null;
  onSelect: (project: ISelectedProject | null) => void;
  locked?: boolean;
}

export const EnhancedProjectPicker: React.FC<IEnhancedProjectPickerProps> = ({ selected, onSelect, locked }) => {
  const styles = useStyles();
  const { leads, fetchLeads } = useLeads();
  const { dataService, currentUser, resolvedPermissions } = useAppContext();
  // §4: useAppNavigate returns ref-stable callback — see Router Stability Rule
  const navigate = useAppNavigate();
  const navProfile = useNavProfile();
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredProject, setHoveredProject] = React.useState<ISelectedProject | null>(null);
  const [accessibleCodes, setAccessibleCodes] = React.useState<string[] | null>(null);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

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

  // Map leads to selectable projects
  const projects = React.useMemo<ISelectedProject[]>(() => {
    let filteredLeads = leads.filter(l => l.ProjectCode && isActiveStage(l.Stage));

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

  // Fuzzy filtered + scored
  const filtered = React.useMemo(() => {
    if (!query.trim()) return projects;
    return projects
      .map(p => ({
        project: p,
        score: Math.max(
          fuzzyScore(query, p.projectName),
          fuzzyScore(query, p.projectCode),
        ),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.project);
  }, [projects, query]);

  // Group filtered by stage
  const grouped = React.useMemo(() => {
    const groups: Record<string, ISelectedProject[]> = {};
    filtered.forEach(p => {
      const key = p.stage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered]);

  // Recent projects (resolve codes to project objects)
  const recentProjects = React.useMemo(() => {
    return navProfile.recent
      .map(code => projects.find(p => p.projectCode === code))
      .filter((p): p is ISelectedProject => p !== undefined);
  }, [navProfile.recent, projects]);

  // Favorites
  const favoriteProjects = React.useMemo(() => {
    return projects.filter(p => navProfile.isFavorite(p.projectCode));
  }, [projects, navProfile]);

  const handleSelect = React.useCallback((project: ISelectedProject) => {
    navProfile.addRecent(project.projectCode);
    setIsOpen(false);
    setQuery('');
    setHoveredProject(null);
    React.startTransition(() => onSelect(project));
  }, [navProfile, onSelect]);

  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    React.startTransition(() => onSelect(null));
  }, [onSelect]);

  const handleHoverStart = React.useCallback((project: ISelectedProject) => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredProject(project), 150);
  }, []);

  const handleHoverEnd = React.useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setHoveredProject(null);
  }, []);

  // Cleanup hover timer
  React.useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  if (locked && selected) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <div className={styles.trigger}>
          <span className={styles.triggerText}>{selected.projectName}</span>
          <span className={styles.projectCode}>{selected.projectCode}</span>
        </div>
      </div>
    );
  }

  const renderHighlightedName = (name: string): React.ReactNode => {
    if (!query.trim()) return name;
    const segments = fuzzyHighlight(query, name);
    return segments.map((seg, i) =>
      seg.highlight ? (
        <span key={i} className={styles.highlight}>{seg.text}</span>
      ) : (
        <React.Fragment key={i}>{seg.text}</React.Fragment>
      )
    );
  };

  const renderProjectRow = (project: ISelectedProject, showStar = true): React.ReactNode => {
    const isSelected = selected?.projectCode === project.projectCode;
    const isFav = navProfile.isFavorite(project.projectCode);

    return (
      <div
        key={project.projectCode}
        className={mergeClasses(styles.projectRow, isSelected && styles.projectRowSelected)}
        onClick={() => handleSelect(project)}
        onMouseEnter={() => handleHoverStart(project)}
        onMouseLeave={handleHoverEnd}
        role="option"
        aria-selected={isSelected}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') handleSelect(project); }}
      >
        <div className={styles.projectInfo}>
          <div className={styles.projectName}>{renderHighlightedName(project.projectName)}</div>
          <div className={styles.projectCode}>
            {renderHighlightedName(project.projectCode)}
            {project.region && <span> &middot; {project.region}</span>}
          </div>
        </div>
        <StageBadge stage={project.stage} size="small" />
        {showStar && (
          <Button
            appearance="subtle"
            size="small"
            icon={isFav ? <Star24Filled style={{ color: HBC_COLORS.orange }} /> : <Star24Regular />}
            onClick={(e) => {
              e.stopPropagation();
              navProfile.toggleFavorite(project.projectCode);
            }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className={styles.starBtn}
          />
        )}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              size="small"
              icon={<MoreHorizontal20Regular />}
              onClick={(e) => e.stopPropagation()}
              aria-label="Project quick actions"
              className={styles.moreBtn}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={() => {
                handleSelect(project);
                navigate('/operations/project');
              }}>
                View Dashboard
              </MenuItem>
              {project.leadId && (
                <MenuItem onClick={() => {
                  handleSelect(project);
                  navigate(`/lead/${project.leadId}`);
                }}>
                  Open Lead
                </MenuItem>
              )}
              <MenuItem onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(project.projectCode).catch(console.error);
                }
              }}>
                Copy Project Code
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    );
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div style={{ padding: '8px 12px' }}>
      <Popover
        open={isOpen}
        onOpenChange={(_, data) => {
          setIsOpen(data.open);
          if (!data.open) {
            setQuery('');
            setHoveredProject(null);
          }
        }}
        positioning="below-start"
        trapFocus
      >
        <PopoverTrigger disableButtonEnhancement>
          <div
            className={mergeClasses(styles.trigger, isOpen && styles.triggerOpen)}
            onClick={() => setIsOpen(!isOpen)}
            role="combobox"
            aria-expanded={isOpen}
            aria-label="Select a project"
          >
            {selected ? (
              <>
                <span className={styles.triggerText}>{selected.projectName}</span>
                <span
                  className={styles.clearBtn}
                  onClick={handleClear}
                  title="Clear selection"
                  role="button"
                  aria-label="Clear project selection"
                >
                  <Dismiss16Regular />
                </span>
              </>
            ) : (
              <span className={styles.triggerPlaceholder}>Select a project...</span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverSurface className={styles.surface}>
          <div className={styles.previewContainer}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Search */}
              <div className={styles.searchSection}>
                <Input
                  autoFocus
                  value={query}
                  onChange={(_, data) => setQuery(data.value)}
                  placeholder="Search projects..."
                  contentBefore={<Search20Regular />}
                  style={{ width: '100%' }}
                  aria-label="Search projects"
                />
              </div>

              <div className={styles.contentArea} role="listbox" aria-label="Projects">
                {/* Recent Section (only when no search query) */}
                {!hasQuery && recentProjects.length > 0 && (
                  <>
                    <div className={styles.sectionHeader}>Recent</div>
                    <div className={styles.recentChips}>
                      {recentProjects.map(p => (
                        <span
                          key={p.projectCode}
                          className={styles.recentChip}
                          onClick={() => handleSelect(p)}
                          title={`${p.projectName} (${p.projectCode})`}
                        >
                          {p.projectName.length > 18 ? `${p.projectName.slice(0, 18)}...` : p.projectName}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Favorites Section (only when no search query) */}
                {!hasQuery && favoriteProjects.length > 0 && (
                  <>
                    <div className={styles.sectionHeader}>Favorites</div>
                    {favoriteProjects.map(p => renderProjectRow(p, true))}
                    <div className={styles.divider} />
                  </>
                )}

                {/* All Projects — grouped by stage */}
                {!hasQuery && (
                  <div className={styles.sectionHeader}>All Projects</div>
                )}

                {filtered.length === 0 ? (
                  <div className={styles.emptyState}>
                    {accessibleCodes !== null && accessibleCodes.length === 0
                      ? 'No projects assigned to you'
                      : 'No matching projects'}
                  </div>
                ) : hasQuery ? (
                  // When searching, show flat ranked results
                  filtered.map(p => renderProjectRow(p))
                ) : (
                  // When browsing, group by stage
                  STAGE_ORDER
                    .filter(stage => grouped[stage] && grouped[stage].length > 0)
                    .map(stage => (
                      <div key={stage}>
                        <div className={styles.stageGroupHeader}>
                          {getStageLabel(stage)}
                        </div>
                        {grouped[stage].map(p => renderProjectRow(p))}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Hover Preview Pane */}
            {hoveredProject && (
              <div style={{ flexShrink: 0, paddingTop: '8px', paddingRight: '8px' }}>
                <ProjectPreviewPane project={hoveredProject} />
              </div>
            )}
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  );
};
