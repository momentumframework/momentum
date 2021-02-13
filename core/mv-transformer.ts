import { ContextAccessor } from "./context-accessor.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { Type } from "./deps.ts";

/**
 * Interface that describes a transformer
 * 
 * @remarks
 * Transformers intercept parameters passed into actions, and allow the parameter to be modified.
 */
export interface MvTransformer {
  transform(
    value: unknown,
    context: ContextAccessor,
    parameterMetadata: ParameterMetadata,
    actionMetadata: ActionMetadata,
    controllerMetadata: ControllerMetadata,
  ): unknown | Promise<unknown>;
}

export interface TransformerMetadata {
  transformer: MvTransformer | Type<MvTransformer>;
  priority?: number;
}
