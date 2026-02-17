import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { useCloseoutChecklist } from '../../hooks/useCloseoutChecklist';
import { useToast } from '../../shared/ToastContainer';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';
import { ChecklistTable, IChecklistTableItem } from '../../shared/ChecklistTable';
import {
  ILead, ICloseoutItem, RoleName, Stage, AuditAction, EntityType,
  CLOSEOUT_SECTIONS, buildBreadcrumbs, ChecklistStatus,
} from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

export const CloseoutChecklist: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, hasPermission, currentUser, dataService } = useAppContext();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { transitionStage } = useWorkflow();
  const {
    items, isLoading, fetchChecklist, updateItem, addItem, removeItem,
  } = useCloseoutChecklist();
  const { addToast } = useToast();

  const [project, setProject] = React.useState<ILead | null>(null);
  const [completing, setCompleting] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';
  const canEdit = true; // Operations team can edit via RoleGate on Complete button

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (projectCode) fetchChecklist(projectCode).catch(console.error);
  }, [projectCode, fetchChecklist]);

  const handleResponseChange = React.useCallback((itemId: number, data: Partial<IChecklistTableItem>) => {
    if (!projectCode || !currentUser) return;

    const changedItem = items.find(i => i.id === itemId);

    // Cast data to Partial<ICloseoutItem> for service call
    const updateData: Partial<ICloseoutItem> = {
      ...data as unknown as Partial<ICloseoutItem>,
      respondedBy: currentUser.email,
      respondedDate: new Date().toISOString(),
    };

    updateItem(projectCode, itemId, updateData).catch(console.error);

    // If item 4.13 changed, auto-compute 4.14 = 4.13 + 80 days
    if (changedItem?.itemNumber === '4.13' && data.dateValue) {
      const d = new Date(data.dateValue);
      d.setDate(d.getDate() + 80);
      const item414 = items.find(i => i.itemNumber === '4.14');
      if (item414) {
        updateItem(projectCode, item414.id, {
          dateValue: d.toISOString(),
          status: 'Conforming' as ChecklistStatus,
          response: 'Conforming',
        }).catch(console.error);
      }
    }

    dataService.logAudit({
      Action: AuditAction.LeadEdited,
      EntityType: EntityType.Closeout,
      EntityId: String(itemId),
      ProjectCode: projectCode,
      User: currentUser.email,
      Details: `Closeout item ${changedItem?.itemNumber || itemId} updated`,
    }).catch(console.error);
  }, [projectCode, currentUser, items, updateItem, dataService]);

  const handleCommentChange = React.useCallback((itemId: number, comment: string) => {
    if (!projectCode) return;
    updateItem(projectCode, itemId, { comment } as Partial<ICloseoutItem>).catch(console.error);
  }, [projectCode, updateItem]);

  const handleAddItem = React.useCallback((sectionNumber: number, partial: Partial<IChecklistTableItem>) => {
    if (!projectCode) return;
    const sectionItems = items.filter(i => i.sectionNumber === sectionNumber);
    const maxSort = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sortOrder)) : 0;
    const section = CLOSEOUT_SECTIONS.find((s: { number: number; name: string }) => s.number === sectionNumber);

    const newItem: Partial<ICloseoutItem> = {
      sectionNumber,
      sectionName: section?.name || partial.sectionName || `Section ${sectionNumber}`,
      itemNumber: `${sectionNumber}.${sectionItems.length + 1}`,
      label: 'Custom item',
      responseType: 'yesNoNA',
      sortOrder: maxSort + 1,
      isCustom: true,
    };

    addItem(projectCode, newItem).then(() => {
      addToast('Custom item added', 'success');
    }).catch(console.error);
  }, [projectCode, items, addItem, addToast]);

  const handleRemoveItem = React.useCallback((itemId: number) => {
    if (!projectCode) return;
    removeItem(projectCode, itemId).catch(console.error);
  }, [projectCode, removeItem]);

  const handleCompleteCloseout = async (): Promise<void> => {
    if (!project || !projectCode) return;
    setCompleting(true);
    try {
      if (project.Stage !== Stage.Closeout) {
        await transitionStage(project, Stage.Closeout);
      }
      await dataService.logAudit({
        Action: AuditAction.LeadEdited, EntityType: EntityType.Project,
        EntityId: projectCode, ProjectCode: projectCode,
        Details: 'Project closeout completed. Archive countdown: 365 days.',
      });
      addToast('Project closeout completed. Auto-archive countdown: 365 days of inactivity before archive.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to complete closeout.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (leadsLoading || isLoading) return <SkeletonLoader variant="table" rows={8} columns={4} />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  const tableItems: IChecklistTableItem[] = items as unknown as IChecklistTableItem[];
  const allResponded = items.length > 0 && items.every(i => (i.status as string) !== 'NoResponse');

  return (
    <div>
      <ChecklistTable
        title="Project Closeout Checklist"
        subtitle={`${project.Title} — ${project.ClientName}`}
        breadcrumb={breadcrumbs}
        sections={CLOSEOUT_SECTIONS}
        items={tableItems}
        isLoading={false}
        canEdit={canEdit}
        onResponseChange={handleResponseChange}
        onCommentChange={handleCommentChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        exportFilename="Project-Closeout-Checklist"
        allItems={tableItems}
      />

      <RoleGate allowedRoles={[RoleName.OperationsTeam]}>
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleCompleteCloseout}
            disabled={!allResponded || completing}
            style={{
              padding: '10px 24px',
              backgroundColor: allResponded ? HBC_COLORS.success : HBC_COLORS.gray300,
              color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600,
              cursor: allResponded && !completing ? 'pointer' : 'not-allowed', fontSize: 14,
            }}
          >
            {completing ? 'Completing...' : 'Complete Closeout'}
          </button>
        </div>
      </RoleGate>
    </div>
  );
};
