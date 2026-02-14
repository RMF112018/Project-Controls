import { RoleName } from './enums';

export interface ITeamMember {
  id: number;
  projectCode: string;
  name: string;
  email: string;
  role: RoleName;
  department: string;
  phone?: string;
}
