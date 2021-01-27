import { ActionMetadata, ControllerMetadata } from "./deps.ts";

export interface ViewEngine {
  renderTemplate(
    model: unknown,
    templateCallback: () => Promise<string | undefined>,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    cacheTemplate: boolean
  ): Promise<string | undefined>;

  resolveFilePath(viewPath: string): string | Promise<string>;
}
