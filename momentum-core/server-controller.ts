import { Type } from "../momentum-di/mod.ts";
import { ControllerCatalog } from "./controller-catalog.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { FilterCatalog } from "./filter-catalog.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";
import { ValueProviderCatalog } from "./value-provider-catalog.ts";

export class ServerController {
  #platform: ServerPlatform;
  #middlewareRegistry: (MvMiddleware | Type<MvMiddleware>)[] = [];
  #middlewareCache?: MvMiddleware[];

  constructor(platform: ServerPlatform) {
    this.#platform = platform;
  }

  async initialize() {
    this.#platform.addMiddlewareHandler(async (context) => {
      try {
        return await this.executeMiddleware(context);
      } catch (err) {
        throw err;
      }
    });
    for (const controller of this.#platform.module.controllers) {
      for (const {
        action,
        route,
        controllerMetadata,
        actionMetadata,
        parameterMetadata,
      } of ControllerCatalog.getMetadataByRoute(controller)) {
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
          this.createHandler(
            controller,
            action,
            controllerMetadata,
            actionMetadata,
            parameterMetadata
          )
        );
      }
    }
  }

  createHandler(
    controller: Type<unknown>,
    action: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ): (context: unknown) => unknown {
    return async (context) => {
      try {
        const controllerInstance = (await this.#platform.resolve(
          controller
        )) as Record<string, (...args: unknown[]) => unknown>;
        const parameters = await this.buildParameters(
          context,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas
        );
        return await this.executeFilters(
          context,
          async () => await controllerInstance[action](...parameters),
          parameters,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas
        );
      } catch (err) {
        throw err;
      }
    };
  }

  registerMiddleware(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#middlewareRegistry.push(middleware);
  }

  private async executeMiddleware(context: unknown) {
    if (!this.#middlewareCache) {
      this.#middlewareCache = await Promise.all(this.getMiddleware());
    }
    let complete = false;
    let next = () => {
      complete = true;
      return Promise.resolve();
    };
    for (const middleware of this.#middlewareCache.reverse()) {
      const n = next;
      next = async () => await middleware.execute(context, n);
    }
    await next();
    return complete;
  }

  private getMiddleware() {
    return this.#middlewareRegistry.map((registration) =>
      typeof registration === "function"
        ? this.#platform.resolve<MvMiddleware>(registration)
        : registration
    );
  }

  registerGlobalFilter(filter: MvFilter | Type<MvFilter>) {
    FilterCatalog.registerGlobalFilter(filter);
  }

  private async executeFilters(
    context: unknown,
    executor: () => Promise<unknown>,
    parameters: unknown[],
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ) {
    const filters = await Promise.all(
      FilterCatalog.getFilters(
        controllerMetadata.type,
        actionMetadata.action
      ).map(async (filter) =>
        typeof filter === "function"
          ? await this.#platform.resolve<MvFilter>(filter)
          : filter
      )
    );
    let next = executor;
    for (const filter of filters.reverse()) {
      const n = next;
      next = () =>
        filter.filter(
          context,
          n,
          parameters,
          {
            type: controllerMetadata.type,
            route: controllerMetadata.route,
          },
          {
            action: actionMetadata.action,
            route: actionMetadata.route,
            method: actionMetadata.method,
          },
          parameterMetadatas?.map((parmeterMetadata) => ({
            index: parmeterMetadata.index,
            name: parmeterMetadata.name,
            type: parmeterMetadata.type,
          }))
        );
    }
    return await next();
  }

  private async buildParameters(
    context: unknown,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ) {
    const parameters: unknown[] = [];
    for (const parameterMetadata of parameterMetadatas ?? []) {
      const valueProvider = ValueProviderCatalog.getValueProvider(
        controllerMetadata.type,
        actionMetadata.action,
        parameterMetadata.index
      );
      if (!valueProvider) {
        continue;
      }
      parameters[parameterMetadata.index] = await valueProvider(
        context,
        this.#platform,
        parameterMetadata
      );
    }
    return parameters;
  }
}
