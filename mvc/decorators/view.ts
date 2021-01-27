import { Type } from "../deps.ts";
import { ViewCatalog } from "../view-catalog.ts";

export function View(
  name: string,
  options?: {
    layout: string | false;
  }
): ClassDecorator & MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (propertyKey) {
      ViewCatalog.registerActionView(
        target.constructor as Type,
        propertyKey.toString(),
        { name }
      );
    } else {
      ViewCatalog.registerControllerView(target as Type, { name, ...options });
    }
  };
}
