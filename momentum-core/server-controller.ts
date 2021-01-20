import { Type } from "../momentum-di/mod.ts";
import { ControllerCatalog } from "./controller-catalog.ts";
import {
  ExtendedActionMetadata,
  ExtendedControllerMetadata,
  ExtendedParameterMetadata,
} from "./controller-metadata-internal.ts";
import { ParameterMetadata } from "./controller-metadata.ts";
import { MvInterceptor } from "./mod.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";

export class ServerController {
  #platform: ServerPlatform;
  #middlewareRegistry: (MvMiddleware | Type<MvMiddleware>)[] = [];
  #middlewareCache?: MvMiddleware[];
  #globalInterceptorRegistry: (MvInterceptor | Type<MvInterceptor>)[] = [];

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
        const result = await controllerInstance[action](...parameters);
        const middlewareResult = await this.executeMiddleware(context, result);
        const interceptorResult = await this.executeInterceptors(
          context,
          middlewareResult,
          parameters,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas
        );
        return interceptorResult;
      } catch (err) {
        throw err;
      }
    };
  }

  registerMiddleware(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#middlewareRegistry.push(middleware);
  }

  private async executeMiddleware(context: unknown, data: unknown) {
    if (!this.#middlewareCache) {
      this.#middlewareCache = this.getMiddleware();
    }
    let result = Promise.resolve(data);
    for (const middleware of this.#middlewareCache ?? []) {
      result = middleware.execute(context, () => result);
    }
    return result;
  }

  private getMiddleware() {
    return this.#middlewareRegistry.map((registration) =>
      typeof registration === "function"
        ? this.#platform.resolve<MvMiddleware>(registration)
        : registration
    );
  }

  registerGlobalInterceptor(interceptor: MvInterceptor | Type<MvInterceptor>) {
    this.#globalInterceptorRegistry.push(interceptor);
  }

  private async executeInterceptors(
    context: unknown,
    data: unknown,
    parameters: unknown[],
    controllerMetadata: ExtendedControllerMetadata,
    actionMetadata: ExtendedActionMetadata,
    parameterMetadatas?: ParameterMetadata[]
  ) {
    const mergedInterceptors = [
      ...this.#globalInterceptorRegistry,
      ...(controllerMetadata.interceptors ?? []),
      ...(actionMetadata.interceptors ?? []),
    ].map((interceptor) =>
      typeof interceptor === "function"
        ? this.#platform.resolve<MvInterceptor>(interceptor)
        : interceptor
    );
    let result = Promise.resolve(data);
    for (const middleware of mergedInterceptors) {
      result = middleware.intercept(
        context,
        () => result,
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
    return result;
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
