import { ControllerCatalog } from "../controller-catalog.ts";
import { ActionMetadata, ControllerClass } from "../controller-metadata.ts";

export function Get(): MethodDecorator;
export function Get(route: string): MethodDecorator;
export function Get(metadata: ActionMetadata): MethodDecorator;
export function Get(
  metadataOrRoute: ActionMetadata | string = { method: "get", route: "/" }
): MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey: string | symbol) {
    ControllerCatalog.registerActionMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      {
        ...(typeof metadataOrRoute === "string"
          ? { route: metadataOrRoute }
          : { ...metadataOrRoute }),
        method: "get",
      }
    );
  };
}
