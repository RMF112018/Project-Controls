export interface ISiteProvisioningDefaults {
  id: number;
  hubSiteUrl: string;
  defaultTemplateId: string;
  autoAssignTeamFromMappings: boolean;
  defaultProjectFeatureFlags: IProjectFeatureFlagDefault[];
  useGitOpsProvisioning: boolean;
  defaultOwnerPermissionLevel: string;
  defaultMemberPermissionLevel: string;
  defaultVisitorPermissionLevel: string;
  roleToGroupMappings: IRoleGroupMapping[];
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface IProjectFeatureFlagDefault {
  featureName: string;
  enabled: boolean;
}

export interface IRoleGroupMapping {
  roleName: string;
  spGroupType: 'Owners' | 'Members' | 'Visitors';
}
