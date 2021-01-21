import { createActionDecorator } from "./create-action-decorator.ts";

export function Post(): MethodDecorator;
export function Post(route: string): MethodDecorator;
export function Post(route?: string): MethodDecorator {
  return createActionDecorator("post", route);
}
