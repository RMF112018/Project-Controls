import { IProjectService } from './IProjectService';
import { IProjectKpiSnapshot } from '../models/IProjectKpiSnapshot';
import { IDataService } from './IDataService';

export class ProjectService implements IProjectService {
  constructor(private dataService: IDataService) {}

  async getKpiSnapshot(projectCode: string): Promise<IProjectKpiSnapshot | undefined> {
    const record = await this.dataService.getDataMartRecord(projectCode);
    if (!record) return undefined;
    return {
      projectCode: record.projectCode,
      projectName: record.projectName,
      clientName: undefined, // IProjectDataMart does not include clientName
      currentContractValue: record.currentContractValue,
      percentComplete: record.percentComplete,
      overallHealth: record.overallHealth,
      lastActivityDate: record.lastSyncDate,
    };
  }

  async getKpiSnapshots(projectCodes: string[]): Promise<IProjectKpiSnapshot[]> {
    const records = await this.dataService.getDataMartRecords();
    const codeSet = new Set(projectCodes.map(c => c.toLowerCase()));
    return records
      .filter(r => codeSet.has(r.projectCode.toLowerCase()))
      .map(r => ({
        projectCode: r.projectCode,
        projectName: r.projectName,
        clientName: undefined,
        currentContractValue: r.currentContractValue,
        percentComplete: r.percentComplete,
        overallHealth: r.overallHealth,
        lastActivityDate: r.lastSyncDate,
      }));
  }

  async getRecommendedProjects(
    userEmail: string,
    _roles: string[],
    limit = 5
  ): Promise<IProjectKpiSnapshot[]> {
    const projects = await this.dataService.getActiveProjects();
    const accessible = await this.dataService.getAccessibleProjects(userEmail);

    let filtered = projects;
    if (accessible.length > 0) {
      const accessSet = new Set(accessible.map(c => c.toLowerCase()));
      filtered = projects.filter(
        p => p.projectCode && accessSet.has(p.projectCode.toLowerCase())
      );
    }

    // Map to snapshots — IActiveProject uses nested sub-interfaces
    const snapshots: IProjectKpiSnapshot[] = filtered.map(p => ({
      projectCode: p.projectCode || '',
      projectName: p.projectName,
      currentContractValue: p.financials.currentContractValue,
      percentComplete: p.schedule.percentComplete,
      overallHealth: p.riskMetrics.complianceStatus,
    }));

    // Sort by most recently active, limit
    return snapshots.slice(0, limit);
  }
}
