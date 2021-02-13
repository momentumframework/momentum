import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Decorator that marks a controller method as a PATCH action
 */
export function Patch(): MethodDecorator;
/**
 * Decorator that marks a controller method as a PATCH action with a route
 */
export function Patch(route: string): MethodDecorator;
export function Patch(route?: string): MethodDecorator {
  return createActionDecorator("patch", route);
}
