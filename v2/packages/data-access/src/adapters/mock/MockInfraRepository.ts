import type { IInfraRepository } from '../../ports/IInfraRepository';

/**
 * Mock infrastructure repository — stubs for provisioning, notifications,
 * meetings, performance, help, data mart, template management.
 *
 * Methods throw 'Not implemented' by default. Flesh out as needed for dev/testing.
 */
export class MockInfraRepository implements IInfraRepository {
  // All methods stubbed — implement as needed during development
  async triggerProvisioning(): Promise<never> { throw new Error('Not implemented'); }
  async getProvisioningStatus(): Promise<null> { return null; }
  async updateProvisioningLog(): Promise<never> { throw new Error('Not implemented'); }
  async getProvisioningLogs(): Promise<[]> { return []; }
  async retryProvisioning(): Promise<never> { throw new Error('Not implemented'); }
  async createProjectSite(): Promise<never> { throw new Error('Not implemented'); }
  async provisionProjectLists(): Promise<void> {}
  async associateWithHubSite(): Promise<void> {}
  async createProjectSecurityGroups(): Promise<void> {}
  async copyTemplateFiles(): Promise<void> {}
  async copyLeadDataToProjectSite(): Promise<void> {}
  async updateSiteProperties(): Promise<void> {}
  async createList(): Promise<void> {}
  async getTemplateSiteConfig(): Promise<null> { return null; }
  async updateTemplateSiteConfig(): Promise<never> { throw new Error('Not implemented'); }
  async getCommittedTemplateRegistry(): Promise<never> { throw new Error('Not implemented'); }
  async getTemplateSiteFiles(): Promise<[]> { return []; }
  async applyGitOpsTemplates(): Promise<{ appliedCount: number }> { return { appliedCount: 0 }; }
  async logTemplateSyncPR(): Promise<never> { throw new Error('Not implemented'); }
  async sendNotification(): Promise<never> { throw new Error('Not implemented'); }
  async getNotifications(): Promise<[]> { return []; }
  async getCalendarAvailability(): Promise<[]> { return []; }
  async createMeeting(): Promise<never> { throw new Error('Not implemented'); }
  async getMeetings(): Promise<[]> { return []; }
  async getActionItems(): Promise<[]> { return []; }
  async getEnvironmentConfig(): Promise<never> { throw new Error('Not implemented'); }
  async promoteTemplates(): Promise<void> {}
  async getSectorDefinitions(): Promise<[]> { return []; }
  async createSectorDefinition(): Promise<never> { throw new Error('Not implemented'); }
  async updateSectorDefinition(): Promise<never> { throw new Error('Not implemented'); }
  async getAssignmentMappings(): Promise<[]> { return []; }
  async createAssignmentMapping(): Promise<never> { throw new Error('Not implemented'); }
  async updateAssignmentMapping(): Promise<never> { throw new Error('Not implemented'); }
  async deleteAssignmentMapping(): Promise<void> {}
  async createBdLeadFolder(): Promise<void> {}
  async checkFolderExists(): Promise<boolean> { return false; }
  async createFolder(): Promise<void> {}
  async renameFolder(): Promise<void> {}
  async getHubSiteUrl(): Promise<string> { return 'https://hedrickbrothers.sharepoint.com'; }
  async setHubSiteUrl(): Promise<void> {}
  async getAppContextConfig(): Promise<null> { return null; }
  async logPerformanceEntry(): Promise<never> { throw new Error('Not implemented'); }
  async getPerformanceLogs(): Promise<[]> { return []; }
  async getPerformanceSummary(): Promise<never> { throw new Error('Not implemented'); }
  async getHelpGuides(): Promise<[]> { return []; }
  async getHelpGuideById(): Promise<null> { return null; }
  async getSupportConfig(): Promise<never> { throw new Error('Not implemented'); }
  async updateHelpGuide(): Promise<never> { throw new Error('Not implemented'); }
  async sendSupportEmail(): Promise<void> {}
  async updateSupportConfig(): Promise<never> { throw new Error('Not implemented'); }
  async syncToDataMart(): Promise<never> { throw new Error('Not implemented'); }
  async getDataMartRecords(): Promise<[]> { return []; }
  async getDataMartRecord(): Promise<null> { return null; }
  async triggerDataMartSync(): Promise<[]> { return []; }
  setProjectSiteUrl(): void {}
}
