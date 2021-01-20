import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";

export interface MvInterceptor {
  intercept(
    context: unknown,
    next: () => Promise<unknown>,
    parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ): Promise<unknown>;
}
