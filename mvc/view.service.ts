import { MVC_CONFIG, VIEW_ENGINE } from "./constants.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  exists,
  Inject,
  Injectable,
  OnPlatformBootstrap,
  Optional,
  PLATFORM,
  Scope,
  ServerPlatform,
  trimSlashes,
  trimTrailingSlashes,
} from "./deps.ts";
import { MvcConfig } from "./mvc-config.ts";
import { ViewCatalog, ViewConfig } from "./view-catalog.ts";
import { ViewEngine } from "./view-engine.ts";
import { ViewHelperCatalog } from "./view-helper-catalog.ts";

const defaultConfig = {
  defaultLayout: "main",
  viewFolder: "./src/views",
  layoutFolder: "./src/views/_layout",
  partialsFolder: "./src/views/_partials",
  cacheTemplates: true,
};

@Injectable({ scope: Scope.Singleton })
export class ViewService implements OnPlatformBootstrap {
  readonly #platform: ServerPlatform;
  readonly #viewEngine: ViewEngine;
  readonly #config: MvcConfig;
  constructor(
    @Inject(PLATFORM)
    platform: ServerPlatform,
    @Inject(VIEW_ENGINE)
    viewEngine: ViewEngine,
    @Optional()
    @Inject(MVC_CONFIG)
    config?: Partial<MvcConfig>
  ) {
    this.#platform = platform;
    this.#viewEngine = viewEngine;
    this.#config = { ...defaultConfig, ...config };
  }

  async mvOnPlatformBootstrap() {
    for (const [type, helpers] of ViewHelperCatalog.getHelpers()) {
      const container = await this.#platform.module.resolve<
        Record<string, (...args: unknown[]) => unknown>
      >(type);
      for (const helper of helpers) {
        this.#viewEngine.registerHelper(helper, (...args) =>
          container[helper](...args)
        );
      }
    }
    if (await exists(this.#config.partialsFolder)) {
      for await (const file of Deno.readDir(this.#config.partialsFolder)) {
        if (!file.isFile) {
          continue;
        }
        const fileLocation = [this.#config.partialsFolder, file.name].join("/");
        const fileContents = await Deno.readTextFile(fileLocation);
        await this.#viewEngine.loadPartial(
          file.name.substring(0, file.name.lastIndexOf(".")),
          file.name,
          fileContents
        );
      }
    }
  }

  async renderView(
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    model: unknown
  ) {
    const viewConfig = ViewCatalog.getView(
      controllerMetadata.type,
      actionMetadata.action
    );
    if (!viewConfig) {
      return;
    }
    return await this.#viewEngine.renderTemplate(
      model,
      controllerMetadata,
      actionMetadata,
      viewConfig.layout ?? this.#config.defaultLayout,
      this.#config.cacheTemplates,
      this.createViewCallback(
        viewConfig,
        controllerMetadata.type.name,
        actionMetadata.action
      ),
      this.createLayoutCallback(viewConfig)
    );
  }

  createViewCallback(
    viewConfig: ViewConfig,
    controller: string,
    action: string
  ) {
    return async () => {
      if (viewConfig.template) {
        return viewConfig.template;
      }
      if (!viewConfig.name) {
        return;
      }
      const path = [trimTrailingSlashes(this.#config.viewFolder)];
      if (viewConfig.path) {
        path.push(trimSlashes(viewConfig.path));
      }
      path.push(trimSlashes(viewConfig.name));
      const templatePath = await this.#viewEngine.resolveFilePath(
        path.join("/")
      );
      if (!(await exists(templatePath))) {
        throw new Error(
          `No template found for action ${action} on controller ${controller}`
        );
      }
      const template = await Deno.readTextFile(templatePath);

      return template;
    };
  }

  createLayoutCallback(viewConfig: ViewConfig) {
    return async () => {
      const layout = viewConfig.layout ?? this.#config.defaultLayout;
      const layoutPath = await this.#viewEngine.resolveFilePath(
        [trimTrailingSlashes(this.#config.viewFolder), "_layout", layout].join(
          "/"
        )
      );
      if (!(await exists(layoutPath))) {
        throw new Error(`Layout template ${layout} not found`);
      }
      const layoutTemplate = await Deno.readTextFile(layoutPath);

      return layoutTemplate;
    };
  }
}
