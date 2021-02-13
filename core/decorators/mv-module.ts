import { Reflect, Scope, Type } from "../deps.ts";
import { ModuleCatalog } from "../module-catalog.ts";
import { ModuleClass, ModuleMetadata } from "../module-metadata.ts";

/**
 * Decorator that marks a class as an MvModule and supplies configuration metadata.
 */
export function MvModule(metadata: ModuleMetadata): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    const paramTypes: Type[] = Reflect.getMetadata("design:paramtypes", target);
    ModuleCatalog.registerMetadata(
      target as ModuleClass,
      paramTypes,
      {},
      metadata,
    );
  };
}
