import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";

export type NextFilter = () => Promise<unknown>;

export interface MvFilter {
  filter(
    context: unknown,
    next: NextFilter,
    parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ): Promise<unknown>;
}
