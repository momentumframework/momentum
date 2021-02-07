export class NewProjectCommandParameters {
  readonly name!: string;
  readonly repositoryUrl!: string;

  constructor(data?: Partial<NewProjectCommandParameters>) {
    Object.assign(this, data);
  }
}
