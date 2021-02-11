import { Type } from "../deps.ts";
import { ViewHelperCatalog } from "../view-helper-catalog.ts";

/**
 * Defines a view helper. A view helper is a function that can be used inside of an MVC view.
 */
export function ViewHelper(): MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey?: string | symbol) {
    ViewHelperCatalog.registerViewHelper(
      target.constructor as Type,
      propertyKey?.toString() as string,
    );
  };
}
