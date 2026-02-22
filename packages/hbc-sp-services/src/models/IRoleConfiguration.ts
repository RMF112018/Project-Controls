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
 * Maps legacy 14-role RoleName values to the new 6 core roles.
 * Bidirectional: used by RoleGate normalization and migration utilities.
 */
export const LEGACY_ROLE_MAP: Record<string, string> = {
  // Direct mappings (kept as-is)
  'Estimating Coordinator': 'Estimating Coordinator',

  // Merged into Admin
  'SharePoint Admin': 'Admin',
  'IDS': 'Admin',

  // Merged into Business Development Manager
  'BD Representative': 'Business Development Manager',
  'Marketing': 'Business Development Manager',

  // Merged into Project Manager
  'Operations Team': 'Project Manager',
  'Preconstruction Team': 'Project Manager',
  'Accounting Manager': 'Project Manager',
  'Legal': 'Project Manager',
  'Risk Management': 'Project Manager',
  'Quality Control': 'Project Manager',
  'Safety': 'Project Manager',

  // Merged into Leadership (global)
  'Executive Leadership': 'Leadership',
  'Department Director': 'Project Executive',
};

/** The 6 canonical role names after migration */
export const CANONICAL_ROLES = [
  'Admin',
  'Business Development Manager',
  'Estimating Coordinator',
  'Project Manager',
  'Leadership',
  'Project Executive',
] as const;

export type CanonicalRoleName = typeof CANONICAL_ROLES[number];

/**
 * Normalizes a role name (legacy or canonical) to its canonical form.
 * Returns the input unchanged if not found in LEGACY_ROLE_MAP (forward-compatible).
 */
export function normalizeRoleName(role: string): string {
  return LEGACY_ROLE_MAP[role] ?? role;
}
