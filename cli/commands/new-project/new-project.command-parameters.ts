import { paramCase, pascalCase } from "../../deps.ts";

export class NewProjectCommandParameters {
  get name() {
    return paramCase(this.providedName);
  }

  readonly providedName!: string;
  readonly repositoryUrl!: string;

  constructor(data?: Partial<NewProjectCommandParameters>) {
    Object.assign(this, data);
  }
}
