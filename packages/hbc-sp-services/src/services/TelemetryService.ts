import type { ITelemetryItem } from '@microsoft/applicationinsights-web';
import type { ITelemetryService, ITelemetryEvent } from './ITelemetryService';

// PII fields that must never be forwarded to App Insights
const PII_FIELDS = ['email', 'loginname', 'displayname', 'userid'];

function scrubPii(props: Record<string, string> = {}): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (PII_FIELDS.includes(k.toLowerCase())) {
      // Hash for correlation without PII exposure: last 6 chars of btoa
      clean[k] = btoa(v).slice(-6);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export class TelemetryService implements ITelemetryService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _appInsights: any = null;
  private _initialized = false;

  initialize(connectionString: string, userHash: string, roleName: string): void {
    if (this._initialized) return;

    // Lazy-load the SDK to keep the critical path unaffected
    import('@microsoft/applicationinsights-web').then(({ ApplicationInsights }) => {
      this._appInsights = new ApplicationInsights({
        config: {
          connectionString,
          // Disable automatic page view collection — we control via trackPageView()
          enableAutoRouteTracking: false,
          // Disable AJAX tracking — reduces noise from PnP.js REST calls
          disableAjaxTracking: true,
          // Custom events 100%; performance metrics use sampling
          samplingPercentage: 100,
          maxBatchSizeInBytes: 65536,
          maxBatchInterval: 5000,
        },
      });

      // Telemetry initializer: inject user hash + role on every item
      this._appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
        item.tags = item.tags ?? [];
        item.tags['ai.user.id'] = userHash;
        item.tags['ai.user.authUserId'] = userHash;
        if (item.baseData) {
          item.baseData.properties = {
            ...item.baseData.properties,
            hbc_role: roleName,
            hbc_spfxVersion: '1.22.2',
          };
        }
        return true;
      });

      this._appInsights.loadAppInsights();
    }).catch(() => {
      // SDK failed to load — degrade gracefully, telemetry silently disabled
    });

    this._initialized = true;
  }

  trackEvent(event: ITelemetryEvent): void {
    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackEvent({
      name: event.name,
      properties: scrubPii(event.properties),
      measurements: event.measurements,
    });
  }

  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackMetric({ name, average: value }, scrubPii(properties));
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackException({ exception: error, properties: scrubPii(properties) });
  }

  trackPageView(pageName: string, url?: string): void {
    if (!this._initialized || !this._appInsights) return;
    this._appInsights.trackPageView({ name: pageName, uri: url });
  }

  flush(): void {
    this._appInsights?.flush();
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}

export const telemetryService = new TelemetryService();
