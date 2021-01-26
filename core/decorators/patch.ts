import { createActionDecorator } from "./create-action-decorator.ts";

export function Patch(): MethodDecorator;
export function Patch(route: string): MethodDecorator;
export function Patch(route?: string): MethodDecorator {
  return createActionDecorator("patch", route);
}
