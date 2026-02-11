import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  IPermissionTemplate,
  ISecurityGroupMapping,
  IProjectTeamAssignment,
  IResolvedPermissions,
} from '../../models/IPermissionTemplate';

export interface IUsePermissionEngineResult {
  templates: IPermissionTemplate[];
  securityGroupMappings: ISecurityGroupMapping[];
  loading: boolean;
  error: string | null;
  resolvePermissions: (userEmail: string, projectCode: string | null) => Promise<IResolvedPermissions>;
  getAccessibleProjects: (userEmail: string) => Promise<string[]>;
  getProjectTeam: (projectCode: string) => Promise<IProjectTeamAssignment[]>;
  assignToProject: (data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  removeFromProject: (id: number) => Promise<void>;
  updateAssignment: (id: number, data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  createTemplate: (data: Partial<IPermissionTemplate>) => Promise<IPermissionTemplate>;
  updateTemplate: (id: number, data: Partial<IPermissionTemplate>) => Promise<IPermissionTemplate>;
  deleteTemplate: (id: number) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchMappings: () => Promise<void>;
  updateMapping: (id: number, data: Partial<ISecurityGroupMapping>) => Promise<ISecurityGroupMapping>;
}

export function usePermissionEngine(): IUsePermissionEngineResult {
  const { dataService } = useAppContext();
  const [templates, setTemplates] = React.useState<IPermissionTemplate[]>([]);
  const [securityGroupMappings, setSecurityGroupMappings] = React.useState<ISecurityGroupMapping[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.getPermissionTemplates();
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const fetchMappings = React.useCallback(async () => {
    try {
      const result = await dataService.getSecurityGroupMappings();
      setSecurityGroupMappings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mappings');
    }
  }, [dataService]);

  const resolvePermissions = React.useCallback(async (userEmail: string, projectCode: string | null) => {
    return dataService.resolveUserPermissions(userEmail, projectCode);
  }, [dataService]);

  const getAccessibleProjects = React.useCallback(async (userEmail: string) => {
    return dataService.getAccessibleProjects(userEmail);
  }, [dataService]);

  const getProjectTeam = React.useCallback(async (projectCode: string) => {
    return dataService.getProjectTeamAssignments(projectCode);
  }, [dataService]);

  const assignToProject = React.useCallback(async (data: Partial<IProjectTeamAssignment>) => {
    return dataService.createProjectTeamAssignment(data);
  }, [dataService]);

  const removeFromProject = React.useCallback(async (id: number) => {
    await dataService.removeProjectTeamAssignment(id);
  }, [dataService]);

  const updateAssignment = React.useCallback(async (id: number, data: Partial<IProjectTeamAssignment>) => {
    return dataService.updateProjectTeamAssignment(id, data);
  }, [dataService]);

  const createTemplate = React.useCallback(async (data: Partial<IPermissionTemplate>) => {
    const result = await dataService.createPermissionTemplate(data);
    setTemplates(prev => [...prev, result]);
    return result;
  }, [dataService]);

  const updateTemplate = React.useCallback(async (id: number, data: Partial<IPermissionTemplate>) => {
    const result = await dataService.updatePermissionTemplate(id, data);
    setTemplates(prev => prev.map(t => t.id === id ? result : t));
    return result;
  }, [dataService]);

  const deleteTemplate = React.useCallback(async (id: number) => {
    await dataService.deletePermissionTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [dataService]);

  const updateMapping = React.useCallback(async (id: number, data: Partial<ISecurityGroupMapping>) => {
    const result = await dataService.updateSecurityGroupMapping(id, data);
    setSecurityGroupMappings(prev => prev.map(m => m.id === id ? result : m));
    return result;
  }, [dataService]);

  return {
    templates,
    securityGroupMappings,
    loading,
    error,
    resolvePermissions,
    getAccessibleProjects,
    getProjectTeam,
    assignToProject,
    removeFromProject,
    updateAssignment,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates,
    fetchMappings,
    updateMapping,
  };
}
