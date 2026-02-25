import { PermissionLevel } from './enums';

/**
 * Configuration-driven role definition stored in SharePoint list.
 * Replaces the hard-coded RoleName enum + ROLE_PERMISSIONS mapping.
 */
export interface IRoleConfiguration {
  id: number;
  roleName: string;
  displayName: string;
  description: string;
  isGlobal: boolean;
  isSystem: boolean;
  isActive: boolean;
  defaultPermissions: string[];
  defaultToolAccess: IRoleToolAccess[];
  navGroupAccess: string[];
  entraGroupId?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface IRoleToolAccess {
  toolKey: string;
  level: PermissionLevel;
}

/**
 * Maps legacy 14-role RoleName values to the new 16-role system.
 * Used by RoleGate normalization and migration utilities.
 */
export const LEGACY_ROLE_MAP: Record<string, string> = {
  'SharePoint Admin': 'Administrator',
  'IDS': 'IDS Manager',
  'BD Representative': 'Business Development Manager',
  'Marketing': 'Marketing Manager',
  'Operations Team': 'Commercial Operations Manager',
  'Preconstruction Team': 'Preconstruction Manager',
  'Estimating Coordinator': 'Estimator',
  'Accounting Manager': 'Accounting Manager',
  'Legal': 'Risk Manager',
  'Risk Management': 'Risk Manager',
  'Quality Control': 'Quality Control Manager',
  'Safety': 'Safety Manager',
  'Executive Leadership': 'Leadership',
  'Department Director': 'Leadership',
};

/** The 16 canonical role names */
export const CANONICAL_ROLES = [
  'Administrator',
  'Leadership',
  'Marketing Manager',
  'Preconstruction Manager',
  'Business Development Manager',
  'Estimator',
  'IDS Manager',
  'Commercial Operations Manager',
  'Luxury Residential Manager',
  'Manager of Operational Excellence',
  'Safety Manager',
  'Quality Control Manager',
  'Warranty Manager',
  'Human Resources Manager',
  'Accounting Manager',
  'Risk Manager',
] as const;

export type CanonicalRoleName = typeof CANONICAL_ROLES[number];

/**
 * Normalizes a role name (legacy or canonical) to its canonical form.
 * Returns the input unchanged if not found in LEGACY_ROLE_MAP (forward-compatible).
 */
export function normalizeRoleName(role: string): string {
  return LEGACY_ROLE_MAP[role] ?? role;
}
