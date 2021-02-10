import { TypeIdentifier } from "./deps.ts";
import {
  ExtendedModuleMetadata,
  ModuleClass,
  ModuleMetadata,
} from "./module-metadata.ts";

export class ModuleCatalog {
  private static readonly catalog = new Map<
    ModuleClass,
    ExtendedModuleMetadata
  >();

  static registerMetadata(
    type: ModuleClass,
    params: TypeIdentifier[],
    props: Record<string, TypeIdentifier>,
    config: ModuleMetadata,
  ) {
    this.catalog.set(type, { ...config, type, params, props });
  }

  static getMetadata(type: ModuleClass) {
    const metadata = this.catalog.get(type);
    if (!metadata) {
      throw new Error(`Module ${type} is not registered`);
    }
    return metadata;
  }
}
