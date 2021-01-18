import { ActionMetadata } from "../controller-metadata.ts";
import { createActionDecorator } from "./create-action-decorator.ts";

export function Patch(): MethodDecorator;
export function Patch(route: string): MethodDecorator;
export function Patch(metadata: ActionMetadata): MethodDecorator;
export function Patch(
  metadataOrRoute?: ActionMetadata | string
): MethodDecorator {
  return createActionDecorator("patch", metadataOrRoute);
}
