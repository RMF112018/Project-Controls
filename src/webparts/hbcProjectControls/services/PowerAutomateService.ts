export interface IProvisioningPayload {
  leadId: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  division: string;
  region: string;
  sector: string;
  requestedBy: string;
  requestedAt: string;
}

export class PowerAutomateService {
  private flowEndpoints: Record<string, string> = {};

  configure(endpoints: Record<string, string>): void {
    this.flowEndpoints = endpoints;
  }

  async triggerProvisioning(payload: IProvisioningPayload): Promise<{ runId: string }> {
    const endpoint = this.flowEndpoints['provisioning'];
    if (!endpoint) throw new Error('Provisioning flow endpoint not configured');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Provisioning trigger failed: ${response.statusText}`);
    }

    return response.json();
  }

  async triggerNotification(payload: {
    type: 'email' | 'teams' | 'both';
    recipients: string[];
    subject: string;
    body: string;
    projectCode?: string;
  }): Promise<void> {
    const endpoint = this.flowEndpoints['notification'];
    if (!endpoint) {
      console.warn('[PowerAutomate] Notification endpoint not configured');
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[PowerAutomate] Notification trigger failed:', response.statusText);
    }
  }

  async triggerArchive(payload: { projectCode: string; reason: string }): Promise<void> {
    const endpoint = this.flowEndpoints['archive'];
    if (!endpoint) throw new Error('Archive flow endpoint not configured');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Archive trigger failed: ${response.statusText}`);
    }
  }
}

export const powerAutomateService = new PowerAutomateService();
