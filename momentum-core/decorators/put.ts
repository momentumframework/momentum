import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Put(): MethodDecorator;
export function Put(route: string): MethodDecorator;
export function Put(metadata: ActionMetadata): MethodDecorator;
export function Put(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("put", metadataOrRoute);
}
