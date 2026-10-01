export type ProviderConfiguration = Readonly<
  Record<string, string | undefined>
>;

export abstract class ProviderClient {
  protected constructor(
    readonly providerName: string,
    readonly configuration: ProviderConfiguration,
  ) {}

  initialize(): never {
    throw new Error(`${this.providerName} integration is not implemented`);
  }
}
