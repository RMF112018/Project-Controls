import {
  CHECKLIST_SECTIONS,
  AuditAction,
  EntityType,
  PERMISSIONS,
  buildBreadcrumbs,
  IChecklistActivityEntry,
  IStartupChecklistItem,
} from '@hbc/sp-services';
import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { useStartupChecklist } from '../../hooks/useStartupChecklist';
import { useToast } from '../../shared/ToastContainer';
import { ChecklistTable, IChecklistTableItem } from '../../shared/ChecklistTable';

export const ProjectStartupChecklist: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, hasPermission, currentUser, dataService } = useAppContext();
  const {
    items, isLoading, fetchChecklist, updateItem, addItem, removeItem,
  } = useStartupChecklist();
  const { addToast } = useToast();

  const canEdit = hasPermission(PERMISSIONS.STARTUP_CHECKLIST_EDIT);
  const canSignOff = hasPermission(PERMISSIONS.STARTUP_CHECKLIST_SIGNOFF);
  const projectCode = selectedProject?.projectCode;

  React.useEffect(() => {
    if (projectCode) {
      fetchChecklist(projectCode).catch(console.error);
    }
  }, [projectCode, fetchChecklist]);

  const handleResponseChange = React.useCallback((itemId: number, data: Partial<IChecklistTableItem>) => {
    if (!projectCode || !currentUser) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const activityEntry: IChecklistActivityEntry = {
      timestamp: new Date().toISOString(),
      user: currentUser.email,
      previousValue: item.response !== null && item.response !== undefined ? String(item.response) : null,
      newValue: data.response !== null && data.response !== undefined ? String(data.response) : null,
    };

    updateItem(projectCode, itemId, {
      ...data as unknown as Partial<IStartupChecklistItem>,
      respondedBy: currentUser.email,
      respondedDate: new Date().toISOString(),
      activityLog: [...item.activityLog, activityEntry],
    }).catch(console.error);

    dataService.logAudit({
      Action: AuditAction.ChecklistItemUpdated,
      EntityType: EntityType.Checklist,
      EntityId: String(itemId),
      ProjectCode: projectCode,
      User: currentUser.email,
      Details: `Item ${item.itemNumber} updated`,
    }).catch(console.error);
  }, [projectCode, currentUser, items, updateItem, dataService]);

  const handleCommentChange = React.useCallback((itemId: number, comment: string) => {
    if (!projectCode) return;
    updateItem(projectCode, itemId, { comment }).catch(console.error);
  }, [projectCode, updateItem]);

  const handleAddItem = React.useCallback((sectionNumber: number, partial: Partial<IChecklistTableItem>) => {
    if (!projectCode) return;
    const sectionItems = items.filter(i => i.sectionNumber === sectionNumber);
    const maxSort = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sortOrder)) : 0;
    const section = CHECKLIST_SECTIONS.find(s => s.number === sectionNumber);

    addItem(projectCode, {
      sectionNumber,
      sectionName: section?.name || partial.sectionName || `Section ${sectionNumber}`,
      itemNumber: `${sectionNumber}.${sectionItems.length + 1}`,
      label: 'Custom item',
      responseType: 'yesNoNA',
      sortOrder: maxSort + 1,
      isCustom: true,
    }).then((created) => {
      if (currentUser) {
        dataService.logAudit({
          Action: AuditAction.ChecklistItemAdded,
          EntityType: EntityType.Checklist,
          EntityId: String(created.id),
          ProjectCode: projectCode,
          User: currentUser.email,
          Details: `Custom item added to section ${sectionNumber}`,
        }).catch(console.error);
      }
      addToast('Custom item added', 'success');
    }).catch(console.error);
  }, [projectCode, items, addItem, currentUser, dataService, addToast]);

  const handleRemoveItem = React.useCallback((itemId: number) => {
    if (!projectCode) return;
    removeItem(projectCode, itemId).catch(console.error);
  }, [projectCode, removeItem]);

  const handleSignOff = React.useCallback(() => {
    if (!currentUser || !projectCode) return;
    dataService.logAudit({
      Action: AuditAction.ChecklistSignedOff,
      EntityType: EntityType.Checklist,
      EntityId: projectCode,
      ProjectCode: projectCode,
      User: currentUser.email,
      Details: `Checklist signed off by ${currentUser.displayName}`,
    }).catch(console.error);
    addToast('Checklist signed off', 'success');
  }, [currentUser, projectCode, dataService, addToast]);

  // Cast items to IChecklistTableItem (compatible shape)
  const tableItems: IChecklistTableItem[] = items as unknown as IChecklistTableItem[];

  return (
    <ChecklistTable
      title="Project Startup Checklist"
      subtitle={projectCode}
      breadcrumb={breadcrumbs}
      sections={CHECKLIST_SECTIONS}
      items={tableItems}
      isLoading={isLoading}
      canEdit={canEdit}
      canSignOff={canSignOff}
      onResponseChange={handleResponseChange}
      onCommentChange={handleCommentChange}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onSignOff={handleSignOff}
      exportFilename="Project-Startup-Checklist"
    />
  );
};
