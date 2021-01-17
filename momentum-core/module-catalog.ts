import { TypeIdentifier } from "../momentum-di/mod.ts";
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
    ModuleCatalog.catalog.set(type, { ...config, type, params, props });
  }

  static getMetadata(type: ModuleClass) {
    const metadata = ModuleCatalog.catalog.get(type);
    if (!metadata) {
      throw new Error(`Module ${type} is not registered`);
    }
    return Object.freeze({ ...metadata });
  }
}