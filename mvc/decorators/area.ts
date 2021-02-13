import { Type } from "../deps.ts";
import { ViewCatalog } from "../view-catalog.ts";

/**
 * Decorator that tells the MVC engine where to find views for controller actions
 */
export function Area(name: string): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    ViewCatalog.registerControllerView(target as Type, { path: name });
  };
}
