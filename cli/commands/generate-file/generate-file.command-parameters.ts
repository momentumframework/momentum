import { InjectableOptions } from "../../../di/mod.ts";
import { paramCase, pascalCase } from "../../deps.ts";
import { FileInfo } from "../../global/mod.ts";

export type SchematicType = "controller" | "module" | "service";

export class GenerateFileCommandParameters {
  /**
   * The name in a kebab-case format (i.e. "todo-item") for file names.
   */
  get name() {
    return paramCase(this.providedName);
  }

  /**
   * The name in a pascal-case format (i.e. "TodoItem") for class names and symbols.
   */
  get className() {
    return pascalCase(this.providedName) + pascalCase(this.schematicType);
  }

  get isGlobalService() {
    if (this.schematicType !== "service") {
      return false;
    }

    return (this.injectableOptions as { global?: boolean }).global;
  }

  readonly providedName!: string;
  readonly providedSchematic!: string;

  readonly schematicType!: SchematicType;
  readonly skipImport!: boolean;
  readonly injectableOptions!: InjectableOptions;

  files = {
    destinationFile: new FileInfo(),
    containingModuleFile: new FileInfo(),
    appModuleFile: new FileInfo(),
    depsFile: new FileInfo(),
  };

  constructor(data?: Partial<GenerateFileCommandParameters>) {
    Object.assign(this, data);

    this.schematicType = this.convertShorthandSchematic();
  }

  private convertShorthandSchematic(): SchematicType {
    const isProvidedInput = (strs: string[]) =>
      strs.includes(this.providedSchematic?.toLocaleLowerCase()?.trim() ?? "");

    if (isProvidedInput(["s", "service"])) {
      return "service";
    }
    if (isProvidedInput(["c", "controller"])) {
      return "controller";
    }
    if (isProvidedInput(["mo", "module"])) {
      return "module";
    }

    throw new Error("Could not determine schematic.");
  }
}
