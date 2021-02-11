import { ContextAccessor } from "./context-accessor.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";

export type NextFilterFunction = () => Promise<unknown>;

/**
 * Interface that describes a filter.
 * 
 * @remarks
 * Filters are executed within the request pipeline and can be used to 
 * modify or cancel the results of a request, or simply hook into the pipeline.
 */
export interface MvFilter {
  filter(
    contextAccessor: ContextAccessor,
    next: NextFilterFunction,
    parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[],
  ): Promise<unknown>;
}
