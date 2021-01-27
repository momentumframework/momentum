import { ActionMetadata, ControllerMetadata } from "./deps.ts";

export interface ViewEngine {
  renderTemplate(
    model: unknown,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    layout: string | false,
    cacheTemplate: boolean,
    templateCallback: () => Promise<string | undefined>,
    layoutCallback: () => Promise<string | undefined>
  ): Promise<string | undefined>;

  resolveFilePath(viewPath: string): string | Promise<string>;
}
