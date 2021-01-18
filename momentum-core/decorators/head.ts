import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Head(): MethodDecorator;
export function Head(route: string): MethodDecorator;
export function Head(metadata: ActionMetadata): MethodDecorator;
export function Head(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("head", metadataOrRoute);
}
