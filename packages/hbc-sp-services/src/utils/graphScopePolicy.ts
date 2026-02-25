/**
 * Phase 7S3: Least-privilege Graph API scope policy.
 *
 * Maps provisioning operations to their minimum required Microsoft Graph scopes.
 * Prevents over-privileged Graph calls by asserting sufficient scopes at runtime.
 */

export type GraphOperation =
  | 'CreateSite'
  | 'DeleteSite'
  | 'CreateGroup'
  | 'DeleteGroup'
  | 'AddGroupMember'
  | 'RemoveGroupMember'
  | 'ReadUser'
  | 'AssociateHubSite'
  | 'DisassociateHubSite'
  | 'ApplyTemplate'
  | 'ReadSite';

/**
 * Maps each Graph operation to the minimum set of scopes required.
 * Only what's needed per operation — no wildcard grants.
 */
export const GRAPH_SCOPE_POLICY: Record<GraphOperation, string[]> = {
  CreateSite: ['Sites.FullControl.All'],
  DeleteSite: ['Sites.FullControl.All'],
  CreateGroup: ['Group.ReadWrite.All'],
  DeleteGroup: ['Group.ReadWrite.All'],
  AddGroupMember: ['Group.ReadWrite.All', 'User.Read.All'],
  RemoveGroupMember: ['Group.ReadWrite.All', 'User.Read.All'],
  ReadUser: ['User.Read.All'],
  AssociateHubSite: ['Sites.FullControl.All'],
  DisassociateHubSite: ['Sites.FullControl.All'],
  ApplyTemplate: ['Sites.FullControl.All'],
  ReadSite: ['Sites.Read.All'],
};

/**
 * Assert that the granted scopes are sufficient for the requested operation.
 * Throws InsufficientScopeError if any required scope is missing.
 */
export function assertSufficientScope(
  operation: GraphOperation,
  grantedScopes: string[]
): void {
  const required = GRAPH_SCOPE_POLICY[operation];
  if (!required) {
    throw new InsufficientScopeError(operation, [], []);
  }

  const grantedSet = new Set(grantedScopes);
  const missing = required.filter(s => !grantedSet.has(s));

  if (missing.length > 0) {
    throw new InsufficientScopeError(operation, missing, grantedScopes);
  }
}

export class InsufficientScopeError extends Error {
  public readonly name = 'InsufficientScopeError';
  public readonly operation: GraphOperation;
  public readonly missingScopes: string[];
  public readonly grantedScopes: string[];

  constructor(operation: GraphOperation, missingScopes: string[], grantedScopes: string[]) {
    super(
      `Insufficient Graph scopes for "${operation}": missing [${missingScopes.join(', ')}]. Granted: [${grantedScopes.join(', ')}]`
    );
    this.operation = operation;
    this.missingScopes = missingScopes;
    this.grantedScopes = grantedScopes;
  }
}
