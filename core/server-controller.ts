import { DiCache } from "../di/di-cache.ts";
import { SCOPED_CONTAINER, SCOPED_RESOLVER } from "./constants.ts";
import { ContextAccessor } from "./context-accessor.ts";
import { ControllerCatalog } from "./controller-catalog.ts";
import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { DependencyResolver, Scope, Type } from "./deps.ts";
import { FilterCatalog } from "./filter-catalog.ts";
import {
  ActionResult,
  ContentResult,
  OnRequestEnd,
  OnRequestStart,
  RedirectResult,
  StatusCodeResult,
} from "./mod.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";
import { ValueProviderCatalog } from "./value-provider-catalog.ts";

export class ServerController {
  readonly #platform: ServerPlatform;
  readonly #middlewareRegistry: (MvMiddleware | Type<MvMiddleware>)[] = [];
  #middlewareCache?: MvMiddleware[];

  constructor(platform: ServerPlatform) {
    this.#platform = platform;
  }

  async initialize() {
    this.#platform.addMiddlewareHandler(async (context) => {
      try {
        return await this.executeMiddleware(
          new ContextAccessor(context, this.#platform)
        );
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
      const diCache = this.#platform.diCache
        .createChild()
        .beginScope(Scope.Injection)
        .beginScope(Scope.Request);
      try {
        const scopedContainer = this.#platform.container.deepClone();
        const scopedResolver = new DependencyResolver(scopedContainer, diCache);
        const contextAccessor = new ContextAccessor(context, this.#platform);
        scopedContainer.registerValue(
          ContextAccessor,
          contextAccessor,
          Scope.Request
        );
        scopedContainer.registerValue(
          SCOPED_CONTAINER,
          scopedContainer,
          Scope.Request
        );
        scopedContainer.registerValue(
          SCOPED_RESOLVER,
          scopedResolver,
          Scope.Request
        );
        const controllerInstance: Record<
          string,
          (...args: unknown[]) => Promise<unknown>
        > = await scopedResolver.resolve(controller);
        for (const item of new Set(diCache.items)) {
          await (item as Partial<OnRequestStart>)?.mvOnRequestStart?.(
            contextAccessor
          );
        }
        const parameters = await this.buildParameters(
          context,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas
        );
        const result = await this.executeFilters(
          context,
          scopedResolver,
          async () => await controllerInstance[action](...parameters),
          parameters,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas
        );
        for (const item of new Set(diCache.items)) {
          await (item as Partial<OnRequestEnd>)?.mvOnRequestEnd?.(
            contextAccessor
          );
        }
        if (result instanceof StatusCodeResult) {
          contextAccessor.setStatus(result.statusCode);
          if (result instanceof RedirectResult) {
            contextAccessor.setHeader("Location", result.location);
            return;
          }
          if (result instanceof ContentResult) {
            contextAccessor.setBody(result.content);
            return;
          }
        }
        return result;
      } catch (err) {
        console.log(err);
        throw err;
      } finally {
        diCache.endScope(Scope.Injection);
        diCache.endScope(Scope.Request);
      }
    };
  }

  registerMiddleware(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#middlewareRegistry.push(middleware);
  }

  private async executeMiddleware(contextAccessor: ContextAccessor) {
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
      next = async () => await middleware.execute(contextAccessor, n);
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
    scopedResolver: DependencyResolver,
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
          ? await scopedResolver.resolve<MvFilter>(filter)
          : filter
      )
    );
    let next = executor;
    for (const filter of filters.reverse()) {
      const localNext = next;
      next = () =>
        filter.filter(
          new ContextAccessor(context, this.#platform),
          localNext,
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
        new ContextAccessor(context, this.#platform),
        parameterMetadata,
        this.#platform
      );
    }
    return parameters;
  }
}
