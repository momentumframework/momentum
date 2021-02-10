import { Type } from "../deps.ts";
import { ViewCatalog } from "../view-catalog.ts";

export function InlineView(template: string): ClassDecorator & MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (propertyKey) {
      ViewCatalog.registerActionView(
        target.constructor as Type,
        propertyKey.toString(),
        { template },
      );
    } else {
      ViewCatalog.registerControllerView(target as Type, { template });
    }
  };
}
