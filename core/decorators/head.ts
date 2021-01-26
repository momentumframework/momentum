import { createActionDecorator } from "./create-action-decorator.ts";

export function Head(): MethodDecorator;
export function Head(route: string): MethodDecorator;
export function Head(route?: string): MethodDecorator {
  return createActionDecorator("head", route);
}
