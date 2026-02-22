export interface IEntraGroupSyncResult {
  projectCode: string;
  groupsCreated: IEntraGroupInfo[];
  membersAdded: IEntraMembershipAction[];
  errors: IEntraSyncError[];
  timestamp: string;
}

export interface IEntraGroupInfo {
  groupId: string;
  displayName: string;
  groupType: 'Owners' | 'Members' | 'Visitors';
  mailNickname: string;
}

export interface IEntraMembershipAction {
  groupId: string;
  userId: string;
  userEmail: string;
  roleName: string;
  success: boolean;
  errorMessage?: string;
}

export interface IEntraSyncError {
  operation: string;
  message: string;
  groupId?: string;
  userId?: string;
}
