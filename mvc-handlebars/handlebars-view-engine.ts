// @deno-types="./handlebars.d.ts"
import Handlebars from "https://dev.jspm.io/handlebars@4.7.6";
import { Inject, Optional } from "../di/mod.ts";
import { MVC_HANDLEBARS_CONFIG } from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  Injectable,
  ViewEngine,
} from "./deps.ts";
import { MvcHandlebarsConfig } from "./mvc-handlebars-config.ts";

const defaultConfig = { fileExtension: ".hbs" };

@Injectable()
export class HandlebarsViewEngine implements ViewEngine {
  readonly #config: MvcHandlebarsConfig;
  readonly #templateCache = new Map<
    ControllerClass,
    { [action: string]: Handlebars.HandlebarsTemplateDelegate }
  >();
  readonly #layoutCache: {
    [layout: string]: Handlebars.HandlebarsTemplateDelegate;
  } = {};

  constructor(
    @Optional()
    @Inject(MVC_HANDLEBARS_CONFIG)
    config?: MvcHandlebarsConfig
  ) {
    this.#config = { ...defaultConfig, ...config };
  }

  async renderTemplate(
    model: unknown,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    layout: string | false,
    cacheTemplate: boolean,
    templateCallback: () => Promise<string | undefined>,
    layoutCallback: () => Promise<string | undefined>
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
    if (layout) {
      const compiledLayoutTemplate = await this.getCompiledLayout(
        layoutCallback,
        layout,
        cacheTemplate
      );
      Handlebars.registerHelper("renderBody", () => compiledTemplate(model));
      const result = compiledLayoutTemplate();
      Handlebars.unregisterHelper("renderBody");
      return result;
    }
    return compiledTemplate(model);
  }

  registerHelper(
    name: string,
    helperFunc: (...args: unknown[]) => unknown
  ): void {
    Handlebars.registerHelper(name, helperFunc);
  }

  loadPartial(name: string, originalFilename: string, template: string) {
    const ext = originalFilename.substring(originalFilename.lastIndexOf("."));
    if (ext === this.#config.fileExtension) {
      const compiledTemplate = Handlebars.compile(template);
      Handlebars.registerPartial(name, compiledTemplate);
    }
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
      if (template == null) {
        return;
      }
      compiledTemplate = Handlebars.compile(template);
      if (cacheTemplate) {
        controllerTemplateCache[action] = compiledTemplate;
      }
    }
    return compiledTemplate;
  }

  private async getCompiledLayout(
    layoutCallback: () => Promise<string | undefined>,
    layout: string,
    cacheTemplate: boolean
  ) {
    let compiledLayoutTemplate = this.#layoutCache[layout];
    if (!compiledLayoutTemplate || !cacheTemplate) {
      const layoutTemplate = await layoutCallback();
      if (!layoutTemplate) {
        return;
      }
      compiledLayoutTemplate = Handlebars.compile(layoutTemplate);
      if (cacheTemplate) {
        this.#layoutCache[layout] = compiledLayoutTemplate;
      }
    }
    return compiledLayoutTemplate;
  }

  resolveFilePath(viewPath: string): string {
    return `${viewPath}${this.#config.fileExtension}`;
  }
}
