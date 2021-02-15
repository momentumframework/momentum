export class ToolUninstallCommandParameters {
  readonly names!: string[];

  constructor(data?: Partial<ToolUninstallCommandParameters>) {
    Object.assign(this, data);
  }
}
