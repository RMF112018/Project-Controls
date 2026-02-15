import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';
import { validateToken } from '../shared/auth.js';
import { projectGroup, entityGroup } from '../shared/groupNames.js';
import { IBroadcastRequest, SignalRMessage } from '../shared/types.js';

const signalROutput = output.generic({
  type: 'signalR',
  name: 'signalRMessages',
  hubName: 'hbcProjectControls',
  connectionStringSetting: 'AzureSignalRConnectionString',
});

async function broadcast(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Validate caller
    const user = await validateToken(request.headers.get('authorization') || undefined);

    const body = (await request.json()) as IBroadcastRequest;
    const message = body.message;

    if (!message || !message.type) {
      return {
        status: 400,
        jsonBody: { error: 'Invalid message: missing type' },
      };
    }

    // Determine target groups from message content
    const groups = resolveTargetGroups(message, body.targetGroups);

    // Build SignalR output messages — one per target group
    const signalRMessages = groups.map((group) => ({
      target: message.type,
      groupName: group,
      arguments: [message],
    }));

    context.extraOutputs.set(signalROutput, signalRMessages);

    context.log(`[broadcast] ${user.email} → ${message.type} → ${groups.length} groups`);

    return { status: 202, jsonBody: { sent: groups.length } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return { status: 401, jsonBody: { error: 'Authentication failed' } };
    }
    context.error('[broadcast] Error:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

function resolveTargetGroups(message: SignalRMessage, explicitGroups?: string[]): string[] {
  if (explicitGroups && explicitGroups.length > 0) {
    return explicitGroups;
  }

  const groups: string[] = [];

  switch (message.type) {
    case 'EntityChanged':
      groups.push(entityGroup(message.entityType));
      if (message.projectCode) {
        groups.push(projectGroup(message.projectCode));
      }
      break;

    case 'WorkflowAdvanced':
      groups.push(entityGroup(message.entityType));
      if (message.projectCode) {
        groups.push(projectGroup(message.projectCode));
      }
      break;

    case 'UserPresence':
      if (message.projectCode) {
        groups.push(projectGroup(message.projectCode));
      }
      break;
  }

  return groups;
}

app.http('broadcast', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'broadcast',
  extraOutputs: [signalROutput],
  handler: broadcast,
});
