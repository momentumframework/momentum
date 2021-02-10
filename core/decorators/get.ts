import { createActionDecorator } from "./create-action-decorator.ts";

/**
 * Makers a controller method as a GET action
 */
export function Get(): MethodDecorator;
/**
 * Makers a controller method as a GET action with a route
 */
export function Get(route: string): MethodDecorator;
export function Get(route?: string): MethodDecorator {
  return createActionDecorator("get", route);
}
