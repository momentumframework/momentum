import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass, ControllerMetadata } from "../controller-metadata.ts";
import { DiContainer, Type } from "../deps.ts";

export function Controller(metadata: ControllerMetadata): ClassDecorator;
export function Controller(route: string): ClassDecorator;
export function Controller(
  metadataOrRoute: ControllerMetadata | string
): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    DiContainer.root().registerFromMetadata(target as Type);
    ControllerCatalog.registerControllerMetadata(
      target as ControllerClass,
      typeof metadataOrRoute === "string"
        ? { type: target as Type, route: metadataOrRoute }
        : metadataOrRoute
    );
  };
}
