import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Post(): MethodDecorator;
export function Post(route: string): MethodDecorator;
export function Post(metadata: ActionMetadata): MethodDecorator;
export function Post(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("post", metadataOrRoute);
}
