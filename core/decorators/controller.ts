import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass, ControllerMetadata } from "../controller-metadata.ts";
import { DiContainer, Reflect, Scope, Type } from "../deps.ts";

/**
 * Decorator that marks a class as a controller
 */
export function Controller(metadata: ControllerMetadata): ClassDecorator;
/**
 * Decorator that marks a class as a controller with a route
 * 
 * @param route base route for actions in the controller
 */
export function Controller(route: string): ClassDecorator;
export function Controller(
  metadataOrRoute: ControllerMetadata | string,
): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    DiContainer.root().registerFromMetadata(
      target as Type,
      Reflect.getMetadata("design:paramtypes", target),
      undefined,
      Scope.Request,
    );
    ControllerCatalog.registerControllerMetadata(
      target as ControllerClass,
      typeof metadataOrRoute === "string"
        ? { type: target as Type, route: metadataOrRoute }
        : metadataOrRoute,
    );
  };
}
