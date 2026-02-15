import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';
import { validateToken } from '../shared/auth.js';
import { isValidGroupName } from '../shared/groupNames.js';
import { IJoinLeaveRequest } from '../shared/types.js';

const signalROutput = output.generic({
  type: 'signalR',
  name: 'signalRGroupActions',
  hubName: 'hbcProjectControls',
  connectionStringSetting: 'AzureSignalRConnectionString',
});

async function groupManagement(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const user = await validateToken(request.headers.get('authorization') || undefined);

    const body = (await request.json()) as IJoinLeaveRequest;

    if (!body.groupName || !body.action) {
      return {
        status: 400,
        jsonBody: { error: 'Missing groupName or action' },
      };
    }

    if (!isValidGroupName(body.groupName)) {
      return {
        status: 400,
        jsonBody: { error: `Invalid group name: ${body.groupName}` },
      };
    }

    if (body.action !== 'join' && body.action !== 'leave') {
      return {
        status: 400,
        jsonBody: { error: 'Action must be "join" or "leave"' },
      };
    }

    const groupAction = {
      userId: user.email,
      groupName: body.groupName,
      action: body.action === 'join' ? 'add' : 'remove',
    };

    context.extraOutputs.set(signalROutput, [groupAction]);

    context.log(`[groups] ${user.email} ${body.action} ${body.groupName}`);

    return { status: 200, jsonBody: { ok: true } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return { status: 401, jsonBody: { error: 'Authentication failed' } };
    }
    context.error('[groups] Error:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('groupManagement', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'groups',
  extraOutputs: [signalROutput],
  handler: groupManagement,
});
