import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a PUT action
 */
export function Put(): MethodDecorator;
/**
 * Makers a controller method as a PUT action with a route
 */
export function Put(route: string): MethodDecorator;
export function Put(route?: string): MethodDecorator {
  return createActionDecorator("put", route);
}
