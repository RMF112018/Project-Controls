/** Stub for @microsoft/sp-webpart-base — only used if webpack resolves it transitively. */

export class BaseClientSideWebPart<TProperties = Record<string, unknown>> {
  protected properties!: TProperties;
  protected domElement!: HTMLElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected context: any = {};

  protected onInit(): Promise<void> {
    return Promise.resolve();
  }

  protected render(): void {
    // stub
  }

  protected onDispose(): void {
    // stub
  }

  protected get dataVersion(): unknown {
    return undefined;
  }

  protected getPropertyPaneConfiguration(): unknown {
    return { pages: [] };
  }
}
