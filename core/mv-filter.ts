import { ContextAccessor } from "./context-accessor.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";

export type NextFilterFunction = () => Promise<unknown>;

export interface MvFilter {
  filter(
    contextAccessor: ContextAccessor,
    next: NextFilterFunction,
    parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ): Promise<unknown>;
}
