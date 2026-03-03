import type {
  IProvisioningLog,
  IFieldDefinition,
  IEnvironmentConfig,
  EnvironmentTier,
  ISectorDefinition,
  IAssignmentMapping,
  INotification,
  IMeeting,
  ICalendarAvailability,
  IActionInboxItem,
  IPerformanceLog,
  IPerformanceQueryOptions,
  IPerformanceSummary,
  IHelpGuide,
  ISupportConfig,
  IProjectDataMart,
  IDataMartSyncResult,
  IDataMartFilter,
  ITemplateSiteConfig,
  ITemplateRegistry,
  ITemplateManifestLog,
} from '@hbc/models';

/** Template file metadata from the live template site. */
export interface ITemplateFileMetadata {
  sourcePath: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  lastModified: string;
  division: string;
}

/**
 * Infrastructure repository — provisioning, environment, sectors, notifications,
 * meetings, performance, help, data mart, template management.
 *
 * These are cross-cutting concerns that don't fit neatly into a single domain.
 */
export interface IInfraRepository {
  // Provisioning
  triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string, metadata?: { division?: string; region?: string; clientName?: string }): Promise<IProvisioningLog>;
  getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null>;
  updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog>;
  getProvisioningLogs(): Promise<IProvisioningLog[]>;
  retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog>;

  // Provisioning Operations
  createProjectSite(projectCode: string, projectName: string, siteAlias: string): Promise<{ siteUrl: string }>;
  provisionProjectLists(siteUrl: string, projectCode: string): Promise<void>;
  associateWithHubSite(siteUrl: string, hubSiteUrl: string): Promise<void>;
  createProjectSecurityGroups(siteUrl: string, projectCode: string, division: string): Promise<void>;
  copyTemplateFiles(siteUrl: string, projectCode: string, division: string): Promise<void>;
  copyLeadDataToProjectSite(siteUrl: string, leadId: number, projectCode: string): Promise<void>;
  updateSiteProperties(siteUrl: string, properties: Record<string, string>): Promise<void>;
  createList(siteUrl: string, listName: string, templateType: number, fields: IFieldDefinition[]): Promise<void>;

  // GitOps Template Provisioning
  getTemplateSiteConfig(): Promise<ITemplateSiteConfig | null>;
  updateTemplateSiteConfig(data: Partial<ITemplateSiteConfig>): Promise<ITemplateSiteConfig>;
  getCommittedTemplateRegistry(): Promise<ITemplateRegistry>;
  getTemplateSiteFiles(): Promise<ITemplateFileMetadata[]>;
  applyGitOpsTemplates(siteUrl: string, division: string, registry: ITemplateRegistry): Promise<{ appliedCount: number }>;
  logTemplateSyncPR(entry: Omit<ITemplateManifestLog, 'id'>): Promise<ITemplateManifestLog>;

  // Notifications
  sendNotification(notification: Partial<INotification>): Promise<INotification>;
  getNotifications(projectCode?: string): Promise<INotification[]>;

  // Meetings / Calendar
  getCalendarAvailability(emails: string[], startDate: string, endDate: string): Promise<ICalendarAvailability[]>;
  createMeeting(meeting: Partial<IMeeting>): Promise<IMeeting>;
  getMeetings(projectCode?: string): Promise<IMeeting[]>;

  // Action Inbox
  getActionItems(userEmail: string): Promise<IActionInboxItem[]>;

  // Environment Configuration
  getEnvironmentConfig(): Promise<IEnvironmentConfig>;
  promoteTemplates(fromTier: EnvironmentTier, toTier: EnvironmentTier, promotedBy: string): Promise<void>;

  // Sector Definitions
  getSectorDefinitions(): Promise<ISectorDefinition[]>;
  createSectorDefinition(data: Partial<ISectorDefinition>): Promise<ISectorDefinition>;
  updateSectorDefinition(id: number, data: Partial<ISectorDefinition>): Promise<ISectorDefinition>;

  // Assignment Mappings
  getAssignmentMappings(): Promise<IAssignmentMapping[]>;
  createAssignmentMapping(data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping>;
  updateAssignmentMapping(id: number, data: Partial<IAssignmentMapping>): Promise<IAssignmentMapping>;
  deleteAssignmentMapping(id: number): Promise<void>;

  // BD Leads Document Library
  createBdLeadFolder(leadTitle: string, originatorName: string): Promise<void>;
  checkFolderExists(path: string): Promise<boolean>;
  createFolder(path: string): Promise<void>;
  renameFolder(oldPath: string, newPath: string): Promise<void>;

  // Hub Site URL
  getHubSiteUrl(): Promise<string>;
  setHubSiteUrl(url: string): Promise<void>;

  // App Context
  getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null>;

  // Performance monitoring
  logPerformanceEntry(entry: Partial<IPerformanceLog>): Promise<IPerformanceLog>;
  getPerformanceLogs(options?: IPerformanceQueryOptions): Promise<IPerformanceLog[]>;
  getPerformanceSummary(options?: IPerformanceQueryOptions): Promise<IPerformanceSummary>;

  // Help & Support
  getHelpGuides(moduleKey?: string): Promise<IHelpGuide[]>;
  getHelpGuideById(id: number): Promise<IHelpGuide | null>;
  getSupportConfig(): Promise<ISupportConfig>;
  updateHelpGuide(id: number, data: Partial<IHelpGuide>): Promise<IHelpGuide>;
  sendSupportEmail(to: string, subject: string, htmlBody: string, fromUserEmail: string): Promise<void>;
  updateSupportConfig(config: Partial<ISupportConfig>): Promise<ISupportConfig>;

  // Project Data Mart
  syncToDataMart(projectCode: string): Promise<IDataMartSyncResult>;
  getDataMartRecords(filters?: IDataMartFilter): Promise<IProjectDataMart[]>;
  getDataMartRecord(projectCode: string): Promise<IProjectDataMart | null>;
  triggerDataMartSync(): Promise<IDataMartSyncResult[]>;

  // Project site URL targeting
  setProjectSiteUrl(siteUrl: string | null): void;
}
