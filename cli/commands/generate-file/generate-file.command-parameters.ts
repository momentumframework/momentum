import { InjectableOptions } from "../../../di/mod.ts";
import { paramCase, pascalCase } from "../../deps.ts";

export type SchematicType = "controller" | "module" | "service";

export class GenerateFileCommandParameters {
  get name() {
    return paramCase(this.providedName);
  }

  get className() {
    return pascalCase(this.providedName) + pascalCase(this.schematicType);
  }

  get isGlobalService() {
    return this.schematicType === "service" &&
      (this.injectableOptions as { global?: boolean }).global === false;
  }

  readonly schematicType!: SchematicType;
  readonly providedName!: string;
  readonly skipImport!: boolean;
  readonly injectableOptions!: InjectableOptions;

  constructor(data?: Partial<GenerateFileCommandParameters>) {
    Object.assign(this, data);
  }
}
