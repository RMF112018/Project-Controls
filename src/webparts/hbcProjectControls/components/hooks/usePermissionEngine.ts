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
  getAllAssignments: () => Promise<IProjectTeamAssignment[]>;
  assignToProject: (data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  removeFromProject: (id: number) => Promise<void>;
  updateAssignment: (id: number, data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  inviteToSiteGroup: (projectCode: string, userEmail: string, role: string) => Promise<void>;
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
    try {
      return await dataService.resolveUserPermissions(userEmail, projectCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve permissions');
      throw err;
    }
  }, [dataService]);

  const getAccessibleProjects = React.useCallback(async (userEmail: string) => {
    try {
      return await dataService.getAccessibleProjects(userEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get accessible projects');
      return [];
    }
  }, [dataService]);

  const getProjectTeam = React.useCallback(async (projectCode: string) => {
    try {
      return await dataService.getProjectTeamAssignments(projectCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get project team');
      return [];
    }
  }, [dataService]);

  const getAllAssignments = React.useCallback(async () => {
    try {
      return await dataService.getAllProjectTeamAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get all assignments');
      return [];
    }
  }, [dataService]);

  const inviteToSiteGroup = React.useCallback(async (
    projectCode: string, userEmail: string, role: string
  ) => {
    try {
      return await dataService.inviteToProjectSiteGroup(projectCode, userEmail, role);
    } catch (err) {
      console.warn('inviteToProjectSiteGroup failed (non-blocking):', err);
    }
  }, [dataService]);

  const assignToProject = React.useCallback(async (data: Partial<IProjectTeamAssignment>) => {
    try {
      return await dataService.createProjectTeamAssignment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign to project');
      throw err;
    }
  }, [dataService]);

  const removeFromProject = React.useCallback(async (id: number) => {
    try {
      await dataService.removeProjectTeamAssignment(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from project');
      throw err;
    }
  }, [dataService]);

  const updateAssignment = React.useCallback(async (id: number, data: Partial<IProjectTeamAssignment>) => {
    try {
      return await dataService.updateProjectTeamAssignment(id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      throw err;
    }
  }, [dataService]);

  const createTemplate = React.useCallback(async (data: Partial<IPermissionTemplate>) => {
    try {
      const result = await dataService.createPermissionTemplate(data);
      setTemplates(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    }
  }, [dataService]);

  const updateTemplate = React.useCallback(async (id: number, data: Partial<IPermissionTemplate>) => {
    try {
      const result = await dataService.updatePermissionTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? result : t));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
      throw err;
    }
  }, [dataService]);

  const deleteTemplate = React.useCallback(async (id: number) => {
    try {
      await dataService.deletePermissionTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      throw err;
    }
  }, [dataService]);

  const updateMapping = React.useCallback(async (id: number, data: Partial<ISecurityGroupMapping>) => {
    try {
      const result = await dataService.updateSecurityGroupMapping(id, data);
      setSecurityGroupMappings(prev => prev.map(m => m.id === id ? result : m));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mapping');
      throw err;
    }
  }, [dataService]);

  return {
    templates,
    securityGroupMappings,
    loading,
    error,
    resolvePermissions,
    getAccessibleProjects,
    getProjectTeam,
    getAllAssignments,
    assignToProject,
    removeFromProject,
    updateAssignment,
    inviteToSiteGroup,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates,
    fetchMappings,
    updateMapping,
  };
}
