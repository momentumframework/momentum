import { Type } from "../deps.ts";
import { ViewCatalog } from "../view-catalog.ts";

/**
 * Decorator that tells the MVC engine which view to render
 */
export function View(
  name: string,
  options?: {
    /**
     * Tells the MVC engine which layout to use, or to disable layout if false
     */
    layout: string | false;
  },
): ClassDecorator & MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (propertyKey) {
      ViewCatalog.registerActionView(
        target.constructor as Type,
        propertyKey.toString(),
        { name, ...options },
      );
    } else {
      ViewCatalog.registerControllerView(target as Type, { name, ...options });
    }
  };
}
