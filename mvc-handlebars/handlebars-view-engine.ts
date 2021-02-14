// @deno-types="./handlebars.d.ts"
import Handlebars from "https://dev.jspm.io/handlebars@4.7.6";
import { Inject, Optional } from "../di/mod.ts";
import { MVC_HANDLEBARS_CONFIG } from "./constants.ts";
import { ControllerClass, Injectable, ViewEngine } from "./deps.ts";
import { MvcHandlebarsConfig } from "./mvc-handlebars-config.ts";

const defaultConfig = { fileExtension: ".hbs" };

@Injectable()
export class HandlebarsViewEngine implements ViewEngine {
  readonly #config: MvcHandlebarsConfig;
  readonly #templateCache: {
    [key: string]: Handlebars.HandlebarsTemplateDelegate;
  } = {};
  readonly #layoutCache: {
    [key: string]: Handlebars.HandlebarsTemplateDelegate;
  } = {};

  constructor(
    @Optional()
    @Inject(MVC_HANDLEBARS_CONFIG)
    config?: MvcHandlebarsConfig,
  ) {
    this.#config = { ...defaultConfig, ...config };
  }

  async renderTemplate(
    model: unknown,
    layout: string | false,
    cacheTemplate: boolean,
    templateKey: string,
    templateCallback: () => Promise<string | undefined>,
    layoutCallback: () => Promise<string | undefined>,
  ) {
    const compiledTemplate = await this.getCompiledTemplate(
      templateCallback,
      templateKey,
      cacheTemplate,
    );
    if (!compiledTemplate) {
      return;
    }
    if (layout) {
      const compiledLayoutTemplate = await this.getCompiledLayout(
        layoutCallback,
        layout,
        cacheTemplate,
      );
      if (compiledLayoutTemplate) {
        Handlebars.registerHelper("renderBody", () => compiledTemplate(model));
        const result = compiledLayoutTemplate();
        Handlebars.unregisterHelper("renderBody");
        return result;
      }
    }
    return compiledTemplate(model);
  }

  registerHelper(
    name: string,
    helperFunc: (...args: unknown[]) => unknown,
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
    templateKey: string,
    cacheTemplate: boolean,
  ) {
    let compiledTemplate = this.#templateCache[templateKey];
    if (!compiledTemplate || !cacheTemplate) {
      const template = await templateCallback();
      if (template == null) {
        return;
      }
      compiledTemplate = Handlebars.compile(template);
      if (cacheTemplate) {
        compiledTemplate[templateKey] = compiledTemplate;
      }
    }
    return compiledTemplate;
  }

  private async getCompiledLayout(
    layoutCallback: () => Promise<string | undefined>,
    layout: string,
    cacheTemplate: boolean,
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
