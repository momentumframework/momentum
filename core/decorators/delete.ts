import { createActionDecorator } from "./create-action-decorator.ts";

export function Delete(): MethodDecorator;
export function Delete(route: string): MethodDecorator;
export function Delete(route?: string): MethodDecorator {
  return createActionDecorator("delete", route);
}
