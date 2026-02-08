import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { App, IAppProps } from './components/App';
import { IDataService } from './services/IDataService';
import { MockDataService } from './services/MockDataService';

export interface IHbcProjectControlsWebPartProps {
  description?: string;
}

export default class HbcProjectControlsWebPart extends BaseClientSideWebPart<IHbcProjectControlsWebPartProps> {
  private _dataService!: IDataService;

  protected async onInit(): Promise<void> {
    await super.onInit();
    // Use MockDataService for development; swap to SharePointDataService for production
    this._dataService = new MockDataService();
  }

  public render(): void {
    const element: React.ReactElement<IAppProps> = React.createElement(App, {
      dataService: this._dataService,
    });

    ReactDom.render(element, this.domElement);
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
