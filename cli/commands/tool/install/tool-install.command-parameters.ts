export class ToolInstallCommandParameters {
  readonly toolUrl!: string;

  constructor(data?: Partial<ToolInstallCommandParameters>) {
    Object.assign(this, data);
  }
}
