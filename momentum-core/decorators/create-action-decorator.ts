import { ControllerCatalog } from "../controller-catalog.ts";
import { ActionMetadata, ControllerClass } from "../controller-metadata.ts";

export function createActionDecorator(
  method: "get" | "post" | "put" | "delete" | "head" | "patch",
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey: string | symbol) {
    let metadata: ActionMetadata;
    if (!metadataOrRoute) {
      metadata = { action: propertyKey.toString(), method, route: "/" };
    } else if (typeof metadataOrRoute === "string") {
      metadata = {
        action: propertyKey.toString(),
        method,
        route: metadataOrRoute,
      };
    } else {
      metadata = { ...metadataOrRoute, action: propertyKey.toString(), method };
    }
    ControllerCatalog.registerActionMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      metadata
    );
  };
}
