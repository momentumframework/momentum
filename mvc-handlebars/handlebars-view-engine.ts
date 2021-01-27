// @deno-types="./handlebars.d.ts"
import Handlebars from "https://dev.jspm.io/handlebars@4.7.6";

import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  Injectable,
  ViewEngine,
} from "./deps.ts";

@Injectable()
export class HandlebarsViewEngine implements ViewEngine {
  readonly #templateCache = new Map<
    ControllerClass,
    { [action: string]: Handlebars.HandlebarsTemplateDelegate }
  >();

  async renderTemplate(
    model: unknown,
    templateCallback: () => Promise<string | undefined>,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    cacheTemplate: boolean
  ) {
    const compiledTemplate = await this.getCompiledTemplate(
      templateCallback,
      controllerMetadata.type,
      actionMetadata.action,
      cacheTemplate
    );
    if (!compiledTemplate) {
      return;
    }
    return compiledTemplate(model);
  }

  private async getCompiledTemplate(
    templateCallback: () => Promise<string | undefined>,
    controllerType: ControllerClass,
    action: string,
    cacheTemplate: boolean
  ) {
    let controllerTemplateCache = this.#templateCache.get(controllerType);
    if (!controllerTemplateCache) {
      controllerTemplateCache = {};
      this.#templateCache.set(controllerType, controllerTemplateCache);
    }
    let compiledTemplate = controllerTemplateCache[action];
    if (!compiledTemplate || !cacheTemplate) {
      const template = await templateCallback();
      if (!template) {
        return;
      }
      compiledTemplate = Handlebars.compile(template);
      if (cacheTemplate) {
        controllerTemplateCache[action] = compiledTemplate;
      }
    }
    return compiledTemplate;
  }

  resolveFilePath(viewPath: string): string {
    return `${viewPath}.hbs`;
  }
}
