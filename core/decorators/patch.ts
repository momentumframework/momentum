import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a PATCH action
 */
export function Patch(): MethodDecorator;
/**
 * Makers a controller method as a PATCH action with a route
 */
export function Patch(route: string): MethodDecorator;
export function Patch(route?: string): MethodDecorator {
  return createActionDecorator("patch", route);
}
