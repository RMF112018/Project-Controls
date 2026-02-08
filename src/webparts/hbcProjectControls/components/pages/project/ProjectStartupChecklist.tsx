import * as React from 'react';
import { HBC_COLORS } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useStartupChecklist } from '../../hooks/useStartupChecklist';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ExportButtons } from '../../shared/ExportButtons';
import {
  IStartupChecklistItem,
  IStartupChecklistSummary,
  ChecklistResponseType,
  ChecklistStatus,
  IChecklistActivityEntry,
  CHECKLIST_SECTIONS,
  AuditAction,
  EntityType,
} from '../../../models';
import { PERMISSIONS } from '../../../utils/permissions';
import { formatDateTime } from '../../../utils/formatters';

/* ---------- Status color map ---------- */
const STATUS_COLORS: Record<ChecklistStatus, string> = {
  Conforming: HBC_COLORS.success,
  Deficient: HBC_COLORS.error,
  NA: HBC_COLORS.gray400,
  Neutral: HBC_COLORS.warning,
  NoResponse: HBC_COLORS.gray300,
};

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  Conforming: 'Conforming',
  Deficient: 'Deficient',
  NA: 'N/A',
  Neutral: 'Neutral',
  NoResponse: 'No Response',
};

/* ---------- Shared styles ---------- */
const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '24px',
  marginBottom: '16px',
};

const badgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 600,
  color: HBC_COLORS.white,
  backgroundColor: color,
});

const smallBadgeStyle = (color: string): React.CSSProperties => ({
  ...badgeStyle(color),
  fontSize: '11px',
  padding: '1px 6px',
});

const responseButtonBase: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '2px solid',
  transition: 'all 0.15s ease',
};

/* ---------- Helper: Summary Badge Row ---------- */
const SummaryBadges: React.FC<{ summary: IStartupChecklistSummary; small?: boolean }> = ({ summary, small }) => {
  const bStyle = small ? smallBadgeStyle : badgeStyle;
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={bStyle(STATUS_COLORS.Conforming)}>{summary.conforming}</span>
      <span style={bStyle(STATUS_COLORS.Deficient)}>{summary.deficient}</span>
      <span style={bStyle(STATUS_COLORS.NA)}>{summary.na}</span>
      <span style={bStyle(STATUS_COLORS.Neutral)}>{summary.neutral}</span>
      <span style={bStyle(STATUS_COLORS.NoResponse)}>{summary.noResponse}</span>
    </div>
  );
};

/* ---------- Main Component ---------- */
export const ProjectStartupChecklist: React.FC = () => {
  const { selectedProject, hasPermission, currentUser, dataService } = useAppContext();
  const {
    items,
    isLoading,
    error,
    fetchChecklist,
    updateItem,
    addItem,
    removeItem,
    getSummary,
    getSectionSummary,
  } = useStartupChecklist();

  const canEdit = hasPermission(PERMISSIONS.STARTUP_CHECKLIST_EDIT);
  const canSignOff = hasPermission(PERMISSIONS.STARTUP_CHECKLIST_SIGNOFF);

  /* Collapsed state per section */
  const [collapsedSections, setCollapsedSections] = React.useState<Record<number, boolean>>({});
  /* Expanded activity logs per item id */
  const [expandedActivity, setExpandedActivity] = React.useState<Record<number, boolean>>({});
  /* Expanded comment fields per item id */
  const [expandedComments, setExpandedComments] = React.useState<Record<number, boolean>>({});
  /* Add custom item form per section */
  const [addingInSection, setAddingInSection] = React.useState<number | null>(null);
  const [newItemLabel, setNewItemLabel] = React.useState('');
  const [newItemResponseType, setNewItemResponseType] = React.useState<ChecklistResponseType>('yesNoNA');

  /* Fetch on mount */
  React.useEffect(() => {
    if (selectedProject?.projectCode) {
      fetchChecklist(selectedProject?.projectCode).catch(console.error);
    }
  }, [selectedProject?.projectCode, fetchChecklist]);

  /* ---------- Handlers ---------- */
  const toggleSection = (sectionNumber: number): void => {
    setCollapsedSections(prev => ({ ...prev, [sectionNumber]: !prev[sectionNumber] }));
  };

  const toggleActivity = (itemId: number): void => {
    setExpandedActivity(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleComment = (itemId: number): void => {
    setExpandedComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleResponseChange = async (
    item: IStartupChecklistItem,
    response: string | number | null,
    status: ChecklistStatus,
  ): Promise<void> => {
    if (!selectedProject?.projectCode || !currentUser) return;

    const activityEntry: IChecklistActivityEntry = {
      timestamp: new Date().toISOString(),
      user: currentUser.email,
      previousValue: item.response !== null && item.response !== undefined ? String(item.response) : null,
      newValue: response !== null && response !== undefined ? String(response) : null,
    };

    await updateItem(selectedProject?.projectCode, item.id, {
      response,
      status,
      respondedBy: currentUser.email,
      respondedDate: new Date().toISOString(),
      activityLog: [...item.activityLog, activityEntry],
    });

    dataService.logAudit({
      Action: AuditAction.ChecklistItemUpdated,
      EntityType: EntityType.Checklist,
      EntityId: String(item.id),
      ProjectCode: selectedProject?.projectCode,
      User: currentUser.email,
      Details: `Response changed to "${response}" (${status}) for item ${item.itemNumber}`,
    }).catch(console.error);
  };

  const handleCommentChange = async (item: IStartupChecklistItem, comment: string): Promise<void> => {
    if (!selectedProject?.projectCode) return;
    await updateItem(selectedProject?.projectCode, item.id, { comment });
  };

  const handleAssignToChange = async (item: IStartupChecklistItem, assignedToName: string): Promise<void> => {
    if (!selectedProject?.projectCode) return;
    await updateItem(selectedProject?.projectCode, item.id, { assignedToName });
  };

  const handleRemoveItem = async (item: IStartupChecklistItem): Promise<void> => {
    if (!selectedProject?.projectCode) return;
    await removeItem(selectedProject?.projectCode, item.id);
  };

  const handleAddItem = async (sectionNumber: number): Promise<void> => {
    if (!selectedProject?.projectCode || !newItemLabel.trim()) return;

    const sectionItems = items.filter(i => i.sectionNumber === sectionNumber);
    const maxSort = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sortOrder)) : 0;
    const section = CHECKLIST_SECTIONS.find(s => s.number === sectionNumber);
    const itemNumber = `${sectionNumber}.${sectionItems.length + 1}`;

    const created = await addItem(selectedProject?.projectCode, {
      projectCode: selectedProject?.projectCode,
      sectionNumber,
      sectionName: section ? section.name : `Section ${sectionNumber}`,
      itemNumber,
      label: newItemLabel.trim(),
      responseType: newItemResponseType,
      response: null,
      status: 'NoResponse',
      respondedBy: null,
      respondedDate: null,
      assignedTo: null,
      assignedToName: null,
      comment: null,
      isHidden: false,
      isCustom: true,
      sortOrder: maxSort + 1,
      activityLog: [],
    });

    if (currentUser) {
      dataService.logAudit({
        Action: AuditAction.ChecklistItemAdded,
        EntityType: EntityType.Checklist,
        EntityId: String(created.id),
        ProjectCode: selectedProject?.projectCode,
        User: currentUser.email,
        Details: `Custom item "${newItemLabel.trim()}" added to section ${sectionNumber}`,
      }).catch(console.error);
    }

    setAddingInSection(null);
    setNewItemLabel('');
    setNewItemResponseType('yesNoNA');
  };

  const handleSignOff = (): void => {
    if (!currentUser || !selectedProject?.projectCode) return;
    dataService.logAudit({
      Action: AuditAction.ChecklistSignedOff,
      EntityType: EntityType.Checklist,
      EntityId: selectedProject?.projectCode,
      ProjectCode: selectedProject?.projectCode,
      User: currentUser.email,
      Details: `Checklist signed off by ${currentUser.displayName}`,
    }).catch(console.error);
  };

  /* ---------- Render helpers ---------- */
  const visibleItems = items.filter(i => !i.isHidden);
  const overallSummary = getSummary();
  const inspectedCount = overallSummary.total - overallSummary.noResponse;

  const renderProgressBar = (summary: IStartupChecklistSummary): React.ReactNode => {
    const responded = summary.total - summary.noResponse;
    const pct = summary.total > 0 ? (responded / summary.total) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <div style={{ flex: 1, height: '6px', backgroundColor: HBC_COLORS.gray200, borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: HBC_COLORS.navy, borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: '11px', color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>{Math.round(pct)}% responded</span>
      </div>
    );
  };

  const renderYesNoNAButtons = (item: IStartupChecklistItem): React.ReactNode => {
    const buttons: Array<{ label: string; status: ChecklistStatus; color: string }> = [
      { label: 'Conforming', status: 'Conforming', color: HBC_COLORS.success },
      { label: 'Deficient', status: 'Deficient', color: HBC_COLORS.error },
      { label: 'N/A', status: 'NA', color: HBC_COLORS.gray400 },
      { label: 'Neutral', status: 'Neutral', color: HBC_COLORS.warning },
    ];
    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {buttons.map(b => {
          const isActive = item.status === b.status;
          return (
            <button
              key={b.status}
              type="button"
              disabled={!canEdit}
              onClick={() => handleResponseChange(item, b.label, b.status)}
              style={{
                ...responseButtonBase,
                backgroundColor: isActive ? b.color : 'transparent',
                color: isActive ? HBC_COLORS.white : b.color,
                borderColor: b.color,
                opacity: canEdit ? 1 : 0.6,
                cursor: canEdit ? 'pointer' : 'default',
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderYesNoWithComment = (item: IStartupChecklistItem): React.ReactNode => {
    const isYes = item.status === 'Conforming';
    const isNo = item.status === 'Deficient';
    return (
      <div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => handleResponseChange(item, 'Yes', 'Conforming')}
            style={{
              ...responseButtonBase,
              backgroundColor: isYes ? HBC_COLORS.success : 'transparent',
              color: isYes ? HBC_COLORS.white : HBC_COLORS.success,
              borderColor: HBC_COLORS.success,
              opacity: canEdit ? 1 : 0.6,
              cursor: canEdit ? 'pointer' : 'default',
            }}
          >
            Yes
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => handleResponseChange(item, 'No', 'Deficient')}
            style={{
              ...responseButtonBase,
              backgroundColor: isNo ? HBC_COLORS.error : 'transparent',
              color: isNo ? HBC_COLORS.white : HBC_COLORS.error,
              borderColor: HBC_COLORS.error,
              opacity: canEdit ? 1 : 0.6,
              cursor: canEdit ? 'pointer' : 'default',
            }}
          >
            No
          </button>
        </div>
        {isYes && (
          <textarea
            placeholder="Add comment..."
            value={item.comment || ''}
            disabled={!canEdit}
            onChange={e => handleCommentChange(item, e.target.value)}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '6px 8px',
              fontSize: '12px',
              border: `1px solid ${HBC_COLORS.gray300}`,
              borderRadius: '4px',
              resize: 'vertical',
              marginTop: '4px',
            }}
          />
        )}
      </div>
    );
  };

  const renderTextInput = (item: IStartupChecklistItem): React.ReactNode => (
    <input
      type="text"
      value={item.response !== null && item.response !== undefined ? String(item.response) : ''}
      disabled={!canEdit}
      placeholder="Enter value..."
      onChange={e => handleResponseChange(item, e.target.value, e.target.value ? 'Conforming' : 'NoResponse')}
      style={{
        padding: '6px 8px',
        fontSize: '13px',
        border: `1px solid ${HBC_COLORS.gray300}`,
        borderRadius: '4px',
        width: '200px',
      }}
    />
  );

  const renderNumericInput = (item: IStartupChecklistItem): React.ReactNode => (
    <input
      type="number"
      value={item.response !== null && item.response !== undefined ? String(item.response) : ''}
      disabled={!canEdit}
      placeholder="0"
      onChange={e => {
        const val = e.target.value ? Number(e.target.value) : null;
        handleResponseChange(item, val, val !== null ? 'Conforming' : 'NoResponse');
      }}
      style={{
        padding: '6px 8px',
        fontSize: '13px',
        border: `1px solid ${HBC_COLORS.gray300}`,
        borderRadius: '4px',
        width: '120px',
      }}
    />
  );

  const renderResponseControls = (item: IStartupChecklistItem): React.ReactNode => {
    switch (item.responseType) {
      case 'yesNoNA': return renderYesNoNAButtons(item);
      case 'yesNoWithComment': return renderYesNoWithComment(item);
      case 'textInput': return renderTextInput(item);
      case 'numeric': return renderNumericInput(item);
      default: return null;
    }
  };

  const renderItemRow = (item: IStartupChecklistItem): React.ReactNode => {
    const activityCount = item.activityLog.length;
    const isActivityOpen = expandedActivity[item.id] || false;
    const isCommentOpen = expandedComments[item.id] || false;

    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          borderBottom: `1px solid ${HBC_COLORS.gray100}`,
        }}
      >
        {/* Main row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left side: number + label */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flex: '1 1 300px', minWidth: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>
              {item.itemNumber}
            </span>
            <span style={{ fontSize: '14px', color: HBC_COLORS.gray800 }}>{item.label}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                title="Hide item"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: HBC_COLORS.gray400,
                  fontSize: '14px',
                  padding: '0 4px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Right side: response controls */}
          <div style={{ flexShrink: 0 }}>
            {renderResponseControls(item)}
          </div>
        </div>

        {/* Responder info */}
        {item.respondedBy && (
          <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '4px', paddingLeft: '32px' }}>
            {item.respondedBy} &middot; {formatDateTime(item.respondedDate)}
          </div>
        )}

        {/* Inline controls row: comment toggle, assign to, activity toggle */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px', paddingLeft: '32px', flexWrap: 'wrap' }}>
          {/* Comment toggle */}
          {item.responseType !== 'yesNoWithComment' && (
            <button
              type="button"
              onClick={() => toggleComment(item.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: HBC_COLORS.info,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {isCommentOpen ? 'Hide comment' : (item.comment ? 'Edit comment' : 'Add comment')}
            </button>
          )}

          {/* Assign To */}
          {canEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>Assign:</span>
              <input
                type="text"
                value={item.assignedToName || ''}
                placeholder="Team member"
                onChange={e => handleAssignToChange(item, e.target.value)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  border: `1px solid ${HBC_COLORS.gray200}`,
                  borderRadius: '3px',
                  width: '120px',
                }}
              />
            </div>
          )}
          {!canEdit && item.assignedToName && (
            <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>Assigned: {item.assignedToName}</span>
          )}

          {/* Activity log toggle */}
          {activityCount > 0 && (
            <button
              type="button"
              onClick={() => toggleActivity(item.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: HBC_COLORS.info,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Activity ({activityCount})
            </button>
          )}
        </div>

        {/* Expandable comment area */}
        {isCommentOpen && item.responseType !== 'yesNoWithComment' && (
          <div style={{ paddingLeft: '32px', marginTop: '6px' }}>
            <textarea
              value={item.comment || ''}
              placeholder="Add a comment..."
              disabled={!canEdit}
              onChange={e => handleCommentChange(item, e.target.value)}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '6px 8px',
                fontSize: '12px',
                border: `1px solid ${HBC_COLORS.gray300}`,
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        {/* Expandable activity log */}
        {isActivityOpen && activityCount > 0 && (
          <div style={{ paddingLeft: '32px', marginTop: '8px' }}>
            <div style={{ borderLeft: `2px solid ${HBC_COLORS.gray200}`, paddingLeft: '12px' }}>
              {item.activityLog.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: '6px', fontSize: '11px', color: HBC_COLORS.gray600 }}>
                  <span style={{ fontWeight: 600 }}>{entry.user}</span>
                  <span style={{ color: HBC_COLORS.gray400, marginLeft: '6px' }}>{formatDateTime(entry.timestamp)}</span>
                  <div style={{ color: HBC_COLORS.gray500, marginTop: '2px' }}>
                    {entry.previousValue !== null ? `"${entry.previousValue}"` : '(none)'}
                    {' \u2192 '}
                    {entry.newValue !== null ? `"${entry.newValue}"` : '(none)'}
                    {entry.comment && <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>{entry.comment}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ---------- Render ---------- */
  if (isLoading) return <LoadingSpinner label="Loading startup checklist..." />;

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.error }}>Error</h2>
        <p style={{ color: HBC_COLORS.gray500 }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Startup Checklist"
        subtitle={selectedProject?.projectCode ? `Project: ${selectedProject?.projectCode}` : undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canSignOff && (
              <button
                type="button"
                onClick={handleSignOff}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: HBC_COLORS.navy,
                  color: HBC_COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Sign Off
              </button>
            )}
            <ExportButtons
              pdfElementId="startup-checklist-export"
              filename="Project-Startup-Checklist"
              title="Project Startup Checklist"
            />
          </div>
        }
      />

      <div id="startup-checklist-export">
        {/* Summary Header Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: HBC_COLORS.navy }}>
              Items Inspected: {inspectedCount} / {overallSummary.total}
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={badgeStyle(STATUS_COLORS.Conforming)}>{overallSummary.conforming}</span>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>Conforming</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={badgeStyle(STATUS_COLORS.Deficient)}>{overallSummary.deficient}</span>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>Deficient</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={badgeStyle(STATUS_COLORS.NA)}>{overallSummary.na}</span>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>N/A</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={badgeStyle(STATUS_COLORS.Neutral)}>{overallSummary.neutral}</span>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>Neutral</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={badgeStyle(STATUS_COLORS.NoResponse)}>{overallSummary.noResponse}</span>
                <span style={{ fontSize: '11px', color: HBC_COLORS.gray500 }}>No Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Cards */}
        {CHECKLIST_SECTIONS.map(section => {
          const sectionSummary = getSectionSummary(section.number);
          const sectionItems = visibleItems
            .filter(i => i.sectionNumber === section.number)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          const isCollapsed = collapsedSections[section.number] || false;

          return (
            <div key={section.number} style={cardStyle}>
              {/* Section header */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection(section.number)}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: HBC_COLORS.navy }}>
                    Section {section.number}: {section.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    <SummaryBadges summary={sectionSummary} small />
                  </div>
                  {renderProgressBar(sectionSummary)}
                </div>
                <span style={{ fontSize: '20px', color: HBC_COLORS.gray400, userSelect: 'none', flexShrink: 0, marginLeft: '12px' }}>
                  {isCollapsed ? '\u25B6' : '\u25BC'}
                </span>
              </div>

              {/* Section items */}
              {!isCollapsed && (
                <div style={{ marginTop: '16px' }}>
                  {sectionItems.map(item => renderItemRow(item))}

                  {/* Add Custom Item */}
                  {canEdit && (
                    <div style={{ marginTop: '12px' }}>
                      {addingInSection === section.number ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={newItemLabel}
                            onChange={e => setNewItemLabel(e.target.value)}
                            placeholder="Item label..."
                            style={{
                              padding: '6px 8px',
                              fontSize: '13px',
                              border: `1px solid ${HBC_COLORS.gray300}`,
                              borderRadius: '4px',
                              flex: '1 1 200px',
                              minWidth: '150px',
                            }}
                          />
                          <select
                            value={newItemResponseType}
                            onChange={e => setNewItemResponseType(e.target.value as ChecklistResponseType)}
                            style={{
                              padding: '6px 8px',
                              fontSize: '13px',
                              border: `1px solid ${HBC_COLORS.gray300}`,
                              borderRadius: '4px',
                            }}
                          >
                            <option value="yesNoNA">Yes/No/NA</option>
                            <option value="yesNoWithComment">Yes/No + Comment</option>
                            <option value="textInput">Text Input</option>
                            <option value="numeric">Numeric</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddItem(section.number)}
                            disabled={!newItemLabel.trim()}
                            style={{
                              padding: '6px 14px',
                              fontSize: '13px',
                              fontWeight: 600,
                              backgroundColor: HBC_COLORS.success,
                              color: HBC_COLORS.white,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: newItemLabel.trim() ? 'pointer' : 'default',
                              opacity: newItemLabel.trim() ? 1 : 0.5,
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingInSection(null); setNewItemLabel(''); setNewItemResponseType('yesNoNA'); }}
                            style={{
                              padding: '6px 14px',
                              fontSize: '13px',
                              backgroundColor: 'transparent',
                              color: HBC_COLORS.gray500,
                              border: `1px solid ${HBC_COLORS.gray300}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingInSection(section.number)}
                          style={{
                            background: 'none',
                            border: `1px dashed ${HBC_COLORS.gray300}`,
                            borderRadius: '4px',
                            padding: '8px 16px',
                            color: HBC_COLORS.gray500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          + Add Custom Item
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
