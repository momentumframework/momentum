import { Type } from "../momentum-di/mod.ts";
import { ControllerCatalog } from "./controller-catalog.ts";
import { ParameterMetadata } from "./controller-metadata.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";

export class ServerController {
  #platform: ServerPlatform;
  #middlewareGetter: () => MvMiddleware[];
  #middlewares?: MvMiddleware[];

  constructor(
    platform: ServerPlatform,
    middlewareGetter: () => MvMiddleware[]
  ) {
    this.#platform = platform;
    this.#middlewareGetter = middlewareGetter;
  }
  async initialize() {
    for (const {
      controller,
      action,
      route,
      controllerMetadata,
      actionMetadata,
      parameterMetadata,
    } of ControllerCatalog.getMetadataByRoute()) {
      if (!controllerMetadata) {
        throw new Error(`Controller ${controller} is not registered`);
      }
      if (!actionMetadata) {
        throw new Error(
          `Controller action ${controller}.${action} is not registered`
        );
      }
      await this.#platform.addRouteHandler(
        controller,
        action,
        route,
        controllerMetadata,
        actionMetadata,
        this.createHandler(controller, action, parameterMetadata)
      );
    }
  }
  createHandler(
    controller: Type<unknown>,
    action: string,
    parameterMetadata: ParameterMetadata[]
  ): (context: unknown) => unknown {
    return async (context) => {
      try {
        const controllerInstance = this.#platform.resolve(controller) as Record<
          string,
          (...args: unknown[]) => unknown
        >;
        const result = await controllerInstance[action](
          ...(await this.buildParameters(context, parameterMetadata))
        );
        return await this.executeMiddleware(context, result);
      } catch (err) {
        throw err;
      }
    };
  }

  private async executeMiddleware(context: unknown, data: unknown) {
    if (!this.#middlewares) {
      this.#middlewares = this.#middlewareGetter();
    }
    let result = Promise.resolve(data);
    for (const middleware of this.#middlewares ?? []) {
      result = middleware.execute(context, () => result);
    }
    return result;
  }

  private async buildParameters(
    context: unknown,
    parameterMetadata: ParameterMetadata[]
  ) {
    const parameters: unknown[] = [];
    for (const metadata of parameterMetadata) {
      const result = await metadata.callback(context, this.#platform, metadata);
      if (metadata.isValueProvider) {
        parameters[metadata.index] = result;
      }
    }
    return parameters;
  }
}
