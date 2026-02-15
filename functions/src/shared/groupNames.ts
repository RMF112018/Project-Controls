/**
 * SignalR group naming conventions.
 *
 * Groups allow targeted message delivery instead of global broadcast:
 *   - project:{code}    — all users viewing a specific project
 *   - entity:{type}     — all users interested in a specific entity type
 *   - role:{name}       — all users with a specific role
 */

export function projectGroup(projectCode: string): string {
  return `project:${projectCode.toLowerCase()}`;
}

export function entityGroup(entityType: string): string {
  return `entity:${entityType.toLowerCase()}`;
}

export function roleGroup(roleName: string): string {
  return `role:${roleName.toLowerCase().replace(/\s+/g, '-')}`;
}

/** Validate that a group name follows the expected pattern */
export function isValidGroupName(groupName: string): boolean {
  return /^(project|entity|role):[a-z0-9_-]+$/.test(groupName);
}
