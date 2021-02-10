import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a HEAD action
 */
export function Head(): MethodDecorator;
/**
 * Makers a controller method as a HEAD action with a route
 */
export function Head(route: string): MethodDecorator;
export function Head(route?: string): MethodDecorator {
  return createActionDecorator("head", route);
}
