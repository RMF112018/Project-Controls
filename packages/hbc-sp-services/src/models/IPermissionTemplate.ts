import { PermissionLevel } from './enums';

export interface IToolAccess {
  toolKey: string;
  level: PermissionLevel;
  granularFlags?: string[];
}

export interface IPermissionTemplate {
  id: number;
  name: string;
  description: string;
  isGlobal: boolean;
  globalAccess: boolean;
  identityType: 'Internal' | 'External';
  toolAccess: IToolAccess[];
  isDefault: boolean;
  isActive: boolean;
  version: number;
  promotedFromTier?: 'dev' | 'vetting' | 'prod';
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface ISecurityGroupMapping {
  id: number;
  securityGroupId: string;
  securityGroupName: string;
  defaultTemplateId: number;
  isActive: boolean;
}

export interface IProjectTeamAssignment {
  id: number;
  projectCode: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  assignedRole: string;
  templateOverrideId?: number;
  granularFlagOverrides?: IGranularFlagOverride[];
  assignedBy: string;
  assignedDate: string;
  isActive: boolean;
}

export interface IGranularFlagOverride {
  toolKey: string;
  flags: string[];
}

export interface IToolDefinition {
  toolKey: string;
  toolGroup: 'marketing' | 'preconstruction' | 'operations' | 'shared_services' | 'admin';
  label: string;
  description: string;
  levels: Record<PermissionLevel, string[]>;
  granularFlags: IGranularFlagDef[];
}

export interface IGranularFlagDef {
  key: string;
  label: string;
  description: string;
  permissions: string[];
}

export interface IResolvedPermissions {
  userId: string;
  projectCode: string | null;
  templateId: number;
  templateName: string;
  source: 'SecurityGroupDefault' | 'ProjectOverride' | 'DirectAssignment';
  toolLevels: Record<string, PermissionLevel>;
  granularFlags: Record<string, string[]>;
  permissions: Set<string>;
  globalAccess: boolean;
}
