export type EntraPrincipalType = 'securityGroup' | 'directoryRole';

export interface IEntraDirectoryPrincipal {
  id: string;
  displayName: string;
  description?: string;
  principalType: EntraPrincipalType;
}
