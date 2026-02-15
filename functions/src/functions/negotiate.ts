import { app, HttpRequest, HttpResponseInit, InvocationContext, input } from '@azure/functions';
import { validateToken } from '../shared/auth.js';

const signalRInput = input.generic({
  type: 'signalRConnectionInfo',
  name: 'connectionInfo',
  hubName: 'hbcProjectControls',
  connectionStringSetting: 'AzureSignalRConnectionString',
  userId: '{headers.x-ms-signalr-userid}',
});

async function negotiate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Validate AAD token
    const user = await validateToken(request.headers.get('authorization') || undefined);

    // Set userId header for SignalR binding
    request.headers.set('x-ms-signalr-userid', user.email);

    const connectionInfo = context.extraInputs.get(signalRInput);

    context.log(`[negotiate] User ${user.email} connected`);

    return {
      status: 200,
      jsonBody: connectionInfo,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('[negotiate] Auth failed:', error);
    return {
      status: 401,
      jsonBody: { error: 'Authentication failed' },
    };
  }
}

app.http('negotiate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'negotiate',
  extraInputs: [signalRInput],
  handler: negotiate,
});
