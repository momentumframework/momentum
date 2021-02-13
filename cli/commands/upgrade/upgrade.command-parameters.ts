export class UpgradeCommandParameters {
  readonly version: string | null = null;

  constructor(data?: Partial<UpgradeCommandParameters>) {
    Object.assign(this, data);
  }
}
