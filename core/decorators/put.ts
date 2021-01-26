import { createActionDecorator } from "./create-action-decorator.ts";

export function Put(): MethodDecorator;
export function Put(route: string): MethodDecorator;
export function Put(route?: string): MethodDecorator {
  return createActionDecorator("put", route);
}
