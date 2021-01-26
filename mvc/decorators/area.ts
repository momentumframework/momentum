import { Type } from "../deps.ts";
import { ViewCatalog } from "../view-catalog.ts";

export function Area(name: string): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    ViewCatalog.registerControllerView(target as Type, { path: name });
  };
}
