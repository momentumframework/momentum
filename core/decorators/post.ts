import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Decorator that marks a controller method as a POST action
 */
export function Post(): MethodDecorator;
/**
 * Decorator that marks a controller method as a POST action with a route
 */
export function Post(route: string): MethodDecorator;
export function Post(route?: string): MethodDecorator {
  return createActionDecorator("post", route);
}
