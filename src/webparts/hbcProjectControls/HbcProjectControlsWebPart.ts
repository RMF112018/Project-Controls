import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { App, IAppProps } from './components/App';
import { IDataService, MockDataService, SharePointDataService, graphService, performanceService, signalRService } from '@hbc/sp-services';

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
  private _root: Root | null = null;

  protected async onInit(): Promise<void> {
    performanceService.startMark('webpart:onInit');
    await super.onInit();

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

    // Initialize PerformanceService with logging function
    performanceService.initialize((entry) => this._dataService.logPerformanceEntry(entry));

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

    const element: React.ReactElement<IAppProps> = React.createElement(App, {
      dataService: this._dataService,
      siteUrl: this.context.pageContext.web.absoluteUrl,
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);

    performanceService.endMark('webpart:render');
  }

  protected onDispose(): void {
    signalRService.dispose();
    this._root?.unmount();
    this._root = null;
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
