import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import { ThemeProvider, IReadonlyTheme } from '@microsoft/sp-component-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { App, IAppProps } from './components/App';
import { mapSpThemeToFluentTheme } from './theme/spThemeBridge';
import { IDataService, MockDataService, SharePointDataService, graphService, performanceService, signalRService, TelemetryService, MockTelemetryService } from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';

export interface IHbcProjectControlsWebPartProps {
  description?: string;
  /**
   * Set to 'sharepoint' to use live SharePoint data service.
   * Defaults to 'mock' for development.
   */
  dataServiceMode?: 'mock' | 'sharepoint';
}

export default class HbcProjectControlsWebPart extends BaseClientSideWebPart<IHbcProjectControlsWebPartProps> {
  private _dataService!: IDataService;
  private _telemetryService!: ITelemetryService;
  private _root: Root | null = null;
  private _themeProvider: ThemeProvider | undefined;
  private _themeVariant: IReadonlyTheme | undefined;

  protected async onInit(): Promise<void> {
    performanceService.startMark('webpart:onInit');
    await super.onInit();
    this._themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this._themeVariant = this._themeProvider.tryGetTheme();
    this._themeProvider.themeChangedEvent.add(this, this._handleThemeChanged);

    const useSP = this.properties.dataServiceMode === 'sharepoint';

    if (useSP) {
      // Production: use SharePointDataService with PnP JS
      const spService = new SharePointDataService();

      // Initialize PnP SP instance
      performanceService.startMark('webpart:pnpInit');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { spfi, SPFx } = require('@pnp/sp');
      require('@pnp/sp/webs');
      require('@pnp/sp/lists');
      require('@pnp/sp/items');
      require('@pnp/sp/folders');
      require('@pnp/sp/files');
      require('@pnp/sp/batching');
      const sp = spfi().using(SPFx(this.context));
      spService.initialize(sp);
      performanceService.endMark('webpart:pnpInit');

      // Provide SPFx page context user info for getCurrentUser()
      performanceService.startMark('webpart:contextInit');
      const pageUser = this.context.pageContext.user;
      spService.initializeContext({
        displayName: pageUser.displayName,
        email: pageUser.email,
        loginName: pageUser.loginName,
        id: 0, // SP user ID resolved at runtime
      });
      performanceService.endMark('webpart:contextInit');

      this._dataService = spService;

      // Initialize GraphService for calendar/email/Teams integration
      performanceService.startMark('webpart:graphInit');
      try {
        const graphClient = await this.context.msGraphClientFactory.getClient('3');
        graphService.initialize(graphClient);
        // Wire audit logger so Graph API calls are recorded in the audit trail
        graphService.setAuditLogger((entry) => this._dataService.logAudit(entry));
      } catch (err) {
        console.warn('[HBC] Failed to initialize Graph client:', err);
      }
      performanceService.endMark('webpart:graphInit');
    } else {
      // Development: use MockDataService
      this._dataService = new MockDataService();
    }

    // Initialize TelemetryService
    if (useSP) {
      const ts = new TelemetryService();
      const userEmail = this.context.pageContext.user.email ?? '';
      const userHash = btoa(userEmail).slice(-8);
      // Connection string read from environment config at runtime via getEnvironmentConfig()
      // For now, empty string — will be populated once EnvironmentConfig SP list is provisioned
      ts.initialize('', userHash, 'Unknown');
      this._telemetryService = ts;
    } else {
      const mock = new MockTelemetryService();
      mock.initialize('', 'dev-user', 'Dev');
      this._telemetryService = mock;
    }

    // Initialize PerformanceService with logging function — also bridge to telemetry
    performanceService.initialize((entry) => {
      // Mirror to App Insights (fire-and-forget, non-blocking)
      this._telemetryService.trackMetric('webpart.TotalLoadMs', entry.TotalLoadMs ?? 0, {
        isProjectSite: String(entry.IsProjectSite ?? false),
      });
      return this._dataService.logPerformanceEntry(entry);
    });

    // Initialize SignalR real-time service (connection deferred until feature flag checked)
    if (useSP) {
      signalRService.initialize(
        'https://func-hbc-signalr-prod.azurewebsites.net/api',
        async () => {
          const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
          return tokenProvider.getToken('api://func-hbc-signalr-prod.azurewebsites.net');
        }
      );
    }

    performanceService.endMark('webpart:onInit');
  }

  public render(): void {
    performanceService.startMark('webpart:render');

    const useSP = this.properties.dataServiceMode === 'sharepoint';
    const element: React.ReactElement<IAppProps> = React.createElement(App, {
      dataService: this._dataService,
      telemetryService: this._telemetryService,
      siteUrl: this.context.pageContext.web.absoluteUrl,
      dataServiceMode: useSP ? 'sharepoint' : 'mock',
      hostTheme: mapSpThemeToFluentTheme(this._themeVariant),
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);

    performanceService.endMark('webpart:render');
  }

  protected onDispose(): void {
    this._themeProvider?.themeChangedEvent.remove(this, this._handleThemeChanged);
    this._telemetryService?.flush();
    signalRService.dispose();
    // Clear query cache on web part disposal to prevent memory leaks
    const { getQueryClient } = require('./tanstack/query/queryClient');
    getQueryClient().clear();
    this._root?.unmount();
    this._root = null;
  }

  private _handleThemeChanged(args: { theme: IReadonlyTheme | undefined }): void {
    this._themeVariant = args.theme;
    this.render();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'HBC Project Controls Configuration' },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('description', {
                  label: 'Description',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
