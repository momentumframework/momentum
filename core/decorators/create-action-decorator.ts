import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass } from "../controller-metadata.ts";

export function createActionDecorator(
  method: "get" | "post" | "put" | "delete" | "head" | "patch",
  route?: string
): MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey: string | symbol) {
    ControllerCatalog.registerActionMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      {
        method,
        route: route ?? "/",
      }
    );
  };
}
