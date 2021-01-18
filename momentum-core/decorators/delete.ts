import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Delete(): MethodDecorator;
export function Delete(route: string): MethodDecorator;
export function Delete(metadata: ActionMetadata): MethodDecorator;
export function Delete(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("delete", metadataOrRoute);
}
