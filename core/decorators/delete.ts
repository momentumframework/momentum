import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a DELETE action
 */
export function Delete(): MethodDecorator;
/**
 * Makers a controller method as a DELETE action with a route
 */
export function Delete(route: string): MethodDecorator;
export function Delete(route?: string): MethodDecorator {
  return createActionDecorator("delete", route);
}
