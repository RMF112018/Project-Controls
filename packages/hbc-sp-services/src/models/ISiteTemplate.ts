import { TemplateSyncStatus } from './enums';

/** Template types matching the SiteTemplates SP list Title column (Choice) */
export type SiteTemplateType = 'Default' | 'Commercial' | 'Luxury Residential';

/**
 * Phase 6A: Site Template entity for the SiteTemplates Hub list.
 * Defines selectable templates (Default, Commercial, Luxury Residential)
 * that admins can manage, sync to GitOps, and apply during provisioning.
 */
export interface ISiteTemplate {
  id: number;
  /** Template name — maps to SP Choice column */
  Title: SiteTemplateType;
  /** URL of the template site used as PnP source */
  TemplateSiteUrl: string;
  /** Lookup to Project_Types list (null = applies to all) */
  ProjectTypeId: number | null;
  /** GitHub repo URL for GitOps sync */
  GitRepoUrl: string;
  /** Last successful sync timestamp (ISO) */
  LastSynced: string | null;
  /** Current sync status */
  SyncStatus: TemplateSyncStatus;
  /** Whether this template is available for selection */
  IsActive: boolean;
  /** Optional description of the template */
  Description?: string;
  /** User who created/modified the template */
  CreatedBy?: string;
  /** Last modification timestamp (ISO) */
  ModifiedAt?: string;
}
