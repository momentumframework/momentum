import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a POST action
 */
export function Post(): MethodDecorator;
/**
 * Makers a controller method as a POST action with a route
 */
export function Post(route: string): MethodDecorator;
export function Post(route?: string): MethodDecorator {
  return createActionDecorator("post", route);
}
