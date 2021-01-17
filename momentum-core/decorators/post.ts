import { ControllerCatalog } from "../controller-catalog.ts";
import { ActionMetadata, ControllerClass } from "../controller-metadata.ts";

export function Post(): MethodDecorator;
export function Post(route: string): MethodDecorator;
export function Post(metadata: ActionMetadata): MethodDecorator;
export function Post(
  metadataOrRoute: ActionMetadata | string = { method: "post", route: "/" }
): MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Object, propertyKey: string | symbol) {
    ControllerCatalog.registerActionMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      typeof metadataOrRoute === "string"
        ? { route: metadataOrRoute }
        : metadataOrRoute
    );
  };
}
