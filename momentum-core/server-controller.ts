import { Type } from "../momentum-di/mod.ts";
import { ControllerCatalog } from "./controller-catalog.ts";
import {
  ExtendedActionMetadata,
  ExtendedControllerMetadata,
  ExtendedParameterMetadata,
} from "./controller-metadata-internal.ts";
import { ParameterMetadata } from "./controller-metadata.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";

export class ServerController {
  #platform: ServerPlatform;
  #middlewareRegistry: (MvMiddleware | Type<MvMiddleware>)[] = [];
  #middlewareCache?: MvMiddleware[];
  #globalFilterRegistry: (MvFilter | Type<MvFilter>)[] = [];

  constructor(platform: ServerPlatform) {
    this.#platform = platform;
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

  createHandler(
    controller: Type<unknown>,
    action: string,
    controllerMetadata: ExtendedControllerMetadata,
    actionMetadata: ExtendedActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ): (context: unknown) => unknown {
    return async (context) => {
      try {
        const controllerInstance = this.#platform.resolve(controller) as Record<
          string,
          (...args: unknown[]) => unknown
        >;
        const parameters = await this.buildParameters(
          context,
          parameterMetadatas
        );
        await this.executeMiddleware(context);
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
      this.#middlewareCache = this.getMiddleware();
    }
    let next = async () => {};
    for (const middleware of this.#middlewareCache.reverse()) {
      const n = next;
      next = async () => await middleware.execute(context, n);
    }
    await next();
  }

  private getMiddleware() {
    return this.#middlewareRegistry.map((registration) =>
      typeof registration === "function"
        ? this.#platform.resolve<MvMiddleware>(registration)
        : registration
    );
  }

  registerGlobalFilter(filter: MvFilter | Type<MvFilter>) {
    this.#globalFilterRegistry.push(filter);
  }

  private async executeFilters(
    context: unknown,
    executor: () => Promise<unknown>,
    parameters: unknown[],
    controllerMetadata: ExtendedControllerMetadata,
    actionMetadata: ExtendedActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ) {
    const mergedFilters = [
      ...this.#globalFilterRegistry,
      ...(controllerMetadata.filters ?? []),
      ...(actionMetadata.filters ?? []),
    ].map((filter) =>
      typeof filter === "function"
        ? this.#platform.resolve<MvFilter>(filter)
        : filter
    );
    let next = executor;
    for (const middleware of mergedFilters.reverse()) {
      const n = next;
      next = async () =>
        middleware.intercept(
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
    parameterMetadata?: ExtendedParameterMetadata[]
  ) {
    const parameters: unknown[] = [];
    for (const metadata of parameterMetadata ?? []) {
      if (!metadata.valueProvider) {
        continue;
      }
      parameters[metadata.index] = await metadata.valueProvider(
        context,
        this.#platform,
        metadata
      );
    }
    return parameters;
  }
}
