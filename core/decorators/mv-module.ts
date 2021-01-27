import { Type, Reflect, ScopeCatalog, Scope } from "../deps.ts";

import { ModuleCatalog } from "../module-catalog.ts";
import { ModuleClass, ModuleMetadata } from "../module-metadata.ts";

export function MvModule(metadata: ModuleMetadata): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    const paramTypes: Type[] = Reflect.getMetadata("design:paramtypes", target);
    ModuleCatalog.registerMetadata(
      target as ModuleClass,
      paramTypes,
      {},
      metadata
    );
    ScopeCatalog.root().registerScopeIdentifier(
      target as ModuleClass,
      Scope.Singleton
    );
  };
}
