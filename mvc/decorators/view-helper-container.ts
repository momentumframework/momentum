import { Injectable, Scope } from "../../di/mod.ts";
import { Type } from "../deps.ts";
import { ViewHelperCatalog } from "../view-helper-catalog.ts";

/**
 * Marks a class as a container for view helpers
 */
export function ViewHelperContainer(): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    ViewHelperCatalog.registerViewHelperContainer(target as Type);
    Injectable({ scope: Scope.Singleton })(target);
  };
}
