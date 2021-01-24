import { ActionMetadata, ControllerMetadata } from "./deps.ts";

export interface ViewEngine {
  renderTemplate(
    model: unknown,
    templateCallback: () => Promise<string | undefined>,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata
  ): Promise<string | undefined>;
}
