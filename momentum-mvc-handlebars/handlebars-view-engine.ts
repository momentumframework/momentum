// @deno-types="./handlebars.d.ts"
import Handlebars from "https://dev.jspm.io/handlebars@4.7.6";

import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  Injectable,
} from "./deps.ts";
import { ViewEngine } from "../momentum-mvc/view-engine.ts";

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
    actionMetadata: ActionMetadata
  ) {
    const compiledTemplate = await this.getCompiledTemplate(
      templateCallback,
      controllerMetadata.type,
      actionMetadata.action
    );
    if (!compiledTemplate) {
      return;
    }
    return compiledTemplate(model);
  }

  private async getCompiledTemplate(
    templateCallback: () => Promise<string | undefined>,
    controllerType: ControllerClass,
    action: string
  ) {
    let controllerTemplateCache = this.#templateCache.get(controllerType);
    if (!controllerTemplateCache) {
      controllerTemplateCache = {};
      this.#templateCache.set(controllerType, controllerTemplateCache);
    }
    let compiledTemplate = controllerTemplateCache[action];
    if (!compiledTemplate) {
      const template = await templateCallback();
      if (!template) {
        return;
      }
      compiledTemplate = Handlebars.compile(template);
      controllerTemplateCache[action] = compiledTemplate;
    }
    return compiledTemplate;
  }
}
