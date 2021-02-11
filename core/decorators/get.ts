import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Decorator that marks a controller method as a GET action
 */
export function Get(): MethodDecorator;
/**
 * Decorator that marks a controller method as a GET action with a route
 */
export function Get(route: string): MethodDecorator;
export function Get(route?: string): MethodDecorator {
  return createActionDecorator("get", route);
}
