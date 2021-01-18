import { ControllerCatalog } from "../controller-catalog.ts";
import { ActionMetadata, ControllerClass } from "../controller-metadata.ts";

export function createActionDecorator(
  method: "get" | "post" | "put" | "delete" | "head" | "patch",
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  let metadata: ActionMetadata;
  if (!metadataOrRoute) {
    metadata = { method, route: "/" };
  } else if (typeof metadataOrRoute === "string") {
    metadata = { method, route: metadataOrRoute };
  } else {
    metadata = { route: "/", ...metadataOrRoute, method };
  }
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey: string | symbol) {
    ControllerCatalog.registerActionMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      metadata
    );
  };
}
