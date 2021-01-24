import { MVC_CONFIG, VIEW_ENGINE } from "./constants.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  exists,
  Inject,
  Optional,
  trimSlashes,
  trimTrailingSlashes,
} from "./deps.ts";
import { MvcConfig } from "./mvc-config.ts";
import { ViewCatalog, ViewConfig } from "./view-catalog.ts";
import { ViewEngine } from "./view-engine.ts";

const defaultConfig = {
  viewFolder: "./views",
  viewFileExtension: "html",
};

export class ViewService {
  readonly #viewEngine: ViewEngine;
  readonly #config: MvcConfig;
  constructor(
    @Inject(VIEW_ENGINE)
    viewEngine: ViewEngine,
    @Optional()
    @Inject(MVC_CONFIG)
    config?: Partial<MvcConfig>
  ) {
    this.#viewEngine = viewEngine;
    this.#config = { ...defaultConfig, ...config };
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
      this.createViewCallback(
        viewConfig,
        controllerMetadata.type.name,
        actionMetadata.action
      ),
      controllerMetadata,
      actionMetadata
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
      const templatePath = `${path.join("/")}.${
        this.#config.viewFileExtension
      }`;
      if (!(await exists(templatePath))) {
        throw new Error(
          `No template found for action ${action} on controller ${controller}`
        );
      }
      const template = await Deno.readTextFile(templatePath);

      return template;
    };
  }
}
