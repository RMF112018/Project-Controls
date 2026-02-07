/** Stub for @microsoft/sp-core-library — only used if webpack resolves it transitively. */

export class Version {
  private _version: string;

  private constructor(version: string) {
    this._version = version;
  }

  public static parse(versionString: string): Version {
    return new Version(versionString);
  }

  public toString(): string {
    return this._version;
  }
}

export class ServiceScope {
  public static createDefaultAndProvide(): ServiceScope {
    return new ServiceScope();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public consume(_key: any): any {
    return undefined;
  }
}
