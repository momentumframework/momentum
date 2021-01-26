import { createActionDecorator } from "./create-action-decorator.ts";

export function Get(): MethodDecorator;
export function Get(route: string): MethodDecorator;
export function Get(route?: string): MethodDecorator {
  return createActionDecorator("get", route);
}
