import { RoleName } from './enums';

export interface IRole {
  id: number;
  Title: RoleName;
  UserOrGroup: string[];
  UserOrGroupIds: number[];
  Permissions: string[];
  IsActive: boolean;
}

export interface ICurrentUser {
  id: number;
  displayName: string;
  email: string;
  loginName: string;
  roles: RoleName[];
  permissions: Set<string>;
  photoUrl?: string;
}
