import { ActionMetadata, ControllerMetadata } from "./deps.ts";

export interface ViewEngine {
  renderTemplate(
    model: unknown,
    layout: string | false,
    cacheTemplate: boolean,
    templateKey: string,
    templateCallback: () => Promise<string | undefined>,
    layoutCallback: () => Promise<string | undefined>,
  ): Promise<string | undefined>;

  resolveFilePath(viewPath: string): string | Promise<string>;

  registerHelper(
    name: string,
    helperFunc: (...args: unknown[]) => unknown,
  ): void;

  loadPartial(
    name: string,
    originalFilename: string,
    template: string,
  ): void | Promise<void>;
}
