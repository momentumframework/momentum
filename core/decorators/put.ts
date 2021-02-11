import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Decorator that marks a controller method as a PUT action
 */
export function Put(): MethodDecorator;
/**
 * Marks a controller method as a PUT action with a route
 */
export function Put(route: string): MethodDecorator;
export function Put(route?: string): MethodDecorator {
  return createActionDecorator("put", route);
}
