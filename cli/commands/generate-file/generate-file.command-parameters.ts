import { paramCase, pascalCase } from "../../deps.ts";

export type SchematicType = "controller" | "module" | "service";

export class GenerateFileCommandParameters {
  get name() {
    return paramCase(this.providedName);
  }

  get className() {
    return pascalCase(this.providedName) + pascalCase(this.schematicType);
  }

  readonly schematicType!: SchematicType;
  readonly providedName!: string;

  constructor(data?: Partial<GenerateFileCommandParameters>) {
    Object.assign(this, data);
  }
}
