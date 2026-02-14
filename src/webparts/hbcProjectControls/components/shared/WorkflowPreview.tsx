import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useWorkflowDefinitions } from '../hooks/useWorkflowDefinitions';
import { useAppContext } from '../contexts/AppContext';
import { useLeads } from '../hooks/useLeads';
import { IResolvedWorkflowStep, WorkflowKey, Stage, isActiveStage } from '@hbc/sp-services';
import { ISelectedProject } from '../contexts/AppContext';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { LoadingSpinner } from './LoadingSpinner';

interface IWorkflowPreviewProps {
  workflowKey: WorkflowKey;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, { color: string; bg: string }> = {
  ProjectRole: { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  Condition: { color: '#065F46', bg: HBC_COLORS.successLight },
  Default: { color: HBC_COLORS.gray600, bg: HBC_COLORS.gray100 },
  Override: { color: '#92400E', bg: HBC_COLORS.warningLight },
};

export const WorkflowPreview: React.FC<IWorkflowPreviewProps> = ({ workflowKey, onClose }) => {
  const { resolveChain } = useWorkflowDefinitions();
  const { selectedProject } = useAppContext();
  const { leads, fetchLeads } = useLeads();

  const [pickedProject, setPickedProject] = React.useState<ISelectedProject | null>(selectedProject);
  const [resolvedSteps, setResolvedSteps] = React.useState<IResolvedWorkflowStep[]>([]);
  const [resolving, setResolving] = React.useState(false);
  const [projectQuery, setProjectQuery] = React.useState('');
  const [showProjectDropdown, setShowProjectDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const projects = React.useMemo(() => {
    return leads
      .filter(l => l.ProjectCode && isActiveStage(l.Stage))
      .map(l => ({
        projectCode: l.ProjectCode!,
        projectName: l.Title,
        stage: l.Stage,
        region: l.Region,
        division: l.Division,
        leadId: l.id,
      }));
  }, [leads]);

  const filteredProjects = React.useMemo(() => {
    if (!projectQuery.trim()) return projects;
    const q = projectQuery.toLowerCase();
    return projects.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q)
    );
  }, [projects, projectQuery]);

  const handleResolve = async (): Promise<void> => {
    if (!pickedProject) return;
    setResolving(true);
    try {
      const result = await resolveChain(workflowKey, pickedProject.projectCode);
      setResolvedSteps(result);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '560px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: ELEVATION.level4,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>
            Preview Resolution
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: HBC_COLORS.gray400, cursor: 'pointer', fontSize: '20px' }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Project picker */}
          <div ref={dropdownRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
              Select Project
            </label>
            <div
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${showProjectDropdown ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: pickedProject ? HBC_COLORS.navy : HBC_COLORS.gray400, fontWeight: pickedProject ? 500 : 400 }}>
                {pickedProject ? `${pickedProject.projectName} (${pickedProject.projectCode})` : 'Select a project...'}
              </span>
              <span style={{ color: HBC_COLORS.gray400 }}>&#9660;</span>
            </div>
            {showProjectDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: '#fff',
                border: `1px solid ${HBC_COLORS.gray200}`,
                borderRadius: '6px',
                boxShadow: ELEVATION.level3,
                maxHeight: '200px',
                overflow: 'auto',
                marginTop: '2px',
              }}>
                <div style={{ padding: '6px', borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
                  <input
                    autoFocus
                    value={projectQuery}
                    onChange={e => setProjectQuery(e.target.value)}
                    placeholder="Search projects..."
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: `1px solid ${HBC_COLORS.gray300}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {filteredProjects.map(p => (
                  <div
                    key={p.projectCode}
                    onClick={() => { setPickedProject(p); setShowProjectDropdown(false); setProjectQuery(''); setResolvedSteps([]); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = HBC_COLORS.gray50)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{p.projectName}</span>
                    <span style={{ color: HBC_COLORS.gray400, marginLeft: '8px' }}>{p.projectCode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolve button */}
          <Button
            appearance="primary"
            size="small"
            disabled={!pickedProject || resolving}
            onClick={() => { handleResolve().catch(console.error); }}
            style={{ backgroundColor: HBC_COLORS.navy, marginBottom: '16px' }}
          >
            {resolving ? 'Resolving...' : 'Resolve Chain'}
          </Button>

          {/* Results */}
          {resolving && <LoadingSpinner label="Resolving workflow chain..." />}

          {!resolving && resolvedSteps.length > 0 && (
            <div>
              {resolvedSteps.map((step, idx) => {
                const sourceStyle = SOURCE_COLORS[step.assignmentSource] || SOURCE_COLORS.Default;
                const isUnresolved = !step.assignee.userId && !step.skipped;
                const isSkipped = step.skipped === true;

                return (
                  <React.Fragment key={step.stepId}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSkipped
                        ? `2px dashed ${HBC_COLORS.gray300}`
                        : `1px solid ${isUnresolved ? HBC_COLORS.error : HBC_COLORS.gray200}`,
                      backgroundColor: isSkipped
                        ? HBC_COLORS.gray50
                        : isUnresolved ? HBC_COLORS.errorLight : '#fff',
                      opacity: isSkipped ? 0.7 : 1,
                    }}>
                      {/* Step number */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isSkipped ? HBC_COLORS.gray400 : isUnresolved ? HBC_COLORS.error : HBC_COLORS.navy,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {step.stepOrder}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: isSkipped ? HBC_COLORS.gray400 : HBC_COLORS.navy }}>{step.name}</span>
                          {isSkipped ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: HBC_COLORS.gray500,
                              backgroundColor: HBC_COLORS.gray200,
                            }}>
                              (Skipped)
                            </span>
                          ) : (
                            <>
                              <span style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: sourceStyle.color,
                                backgroundColor: sourceStyle.bg,
                              }}>
                                {step.assignmentSource}
                              </span>
                              {step.canChairMeeting && (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: HBC_COLORS.gray600,
                                  backgroundColor: HBC_COLORS.gray100,
                                }}>
                                  Chair
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: isSkipped ? HBC_COLORS.gray400 : isUnresolved ? HBC_COLORS.error : HBC_COLORS.gray500, marginTop: '2px' }}>
                          {isSkipped ? (step.skipReason || 'Skipped due to disabled feature flag') : (
                            <>
                              {step.assignee.displayName}
                              {step.assignee.email && ` (${step.assignee.email})`}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {idx < resolvedSteps.length - 1 && (
                      <div style={{ textAlign: 'center', padding: '4px 0', color: HBC_COLORS.gray300, fontSize: '16px' }}>
                        &#8595;
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
