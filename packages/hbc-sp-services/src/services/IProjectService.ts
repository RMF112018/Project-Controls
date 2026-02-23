import { IProjectKpiSnapshot } from '../models/IProjectKpiSnapshot';

export interface IProjectService {
  getKpiSnapshot(projectCode: string): Promise<IProjectKpiSnapshot | undefined>;
  getKpiSnapshots(projectCodes: string[]): Promise<IProjectKpiSnapshot[]>;
  getRecommendedProjects(userEmail: string, roles: string[], limit?: number): Promise<IProjectKpiSnapshot[]>;
}
