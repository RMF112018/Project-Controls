import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { App, IAppProps } from './components/App';
import { IDataService } from './services/IDataService';
import { MockDataService } from './services/MockDataService';
import { RenderMode } from './models/enums';

export interface IHbcProjectControlsWebPartProps {
  renderModeOverride?: string;
}

export default class HbcProjectControlsWebPart extends BaseClientSideWebPart<IHbcProjectControlsWebPartProps> {
  private _dataService!: IDataService;

  protected async onInit(): Promise<void> {
    await super.onInit();
    // Use MockDataService for development; swap to SharePointDataService for production
    this._dataService = new MockDataService();
  }

  public render(): void {
    const renderMode = this._detectRenderMode();

    const element: React.ReactElement<IAppProps> = React.createElement(App, {
      dataService: this._dataService,
      renderMode,
    });

    ReactDom.render(element, this.domElement);
  }

  private _detectRenderMode(): RenderMode {
    // Allow override via web part property (useful for testing)
    if (this.properties.renderModeOverride) {
      const override = this.properties.renderModeOverride.toLowerCase();
      if (override === 'full' || override === 'project' || override === 'standalone') {
        return override as RenderMode;
      }
    }

    // Default to full (hub) mode for development
    return RenderMode.Full;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
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
              groupName: 'Development Settings',
              groupFields: [
                PropertyPaneTextField('renderModeOverride', {
                  label: 'Render Mode Override',
                  description: 'Override render mode: full, project, or standalone',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
