import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Get(): MethodDecorator;
export function Get(route: string): MethodDecorator;
export function Get(metadata: ActionMetadata): MethodDecorator;
export function Get(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("get", metadataOrRoute);
}
