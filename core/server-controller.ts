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
  ContentResult,
  MvTransformer,
  OnRequestEnd,
  OnRequestStart,
  RedirectResult,
  StatusCodeResult,
} from "./mod.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerPlatform } from "./platform.ts";
import { ServerException } from "./server-exception.ts";
import { TransformerCatalog } from "./transformer-catalog.ts";
import { ValueProviderCatalog } from "./value-provider-catalog.ts";

export type ErrorHandler = (
  error: unknown,
  contextAccessor: ContextAccessor,
) => void | { handled: true } | Promise<void | { handled: true }>;

export class ServerController {
  readonly #platform: ServerPlatform;
  readonly #middlewareRegistry: (MvMiddleware | Type<MvMiddleware>)[] = [];
  #middlewareCache?: MvMiddleware[];
  #globalErrorHandlers: { errorHandler: ErrorHandler; priority?: number }[] =
    [];

  constructor(platform: ServerPlatform) {
    this.#platform = platform;
  }

  async initialize() {
    this.#platform.addMiddlewareHandler(async (context) => {
      const contextAccessor = new ContextAccessor(context, this.#platform);
      try {
        return await this.executeMiddleware(
          contextAccessor,
        );
      } catch (err) {
        await this.handleError(err, contextAccessor);
        return true;
      }
    });
    for (const controller of this.#platform.module.controllers) {
      for (
        const {
          action,
          route,
          controllerMetadata,
          actionMetadata,
          parameterMetadata,
        } of ControllerCatalog.getMetadataByRoute(controller)
      ) {
        if (!controllerMetadata) {
          throw new Error(`Controller ${controller} is not registered`);
        }
        if (!actionMetadata) {
          throw new Error(
            `Controller action ${controller}.${action} is not registered`,
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
            parameterMetadata,
          ),
        );
      }
    }
  }

  createHandler(
    controller: Type<unknown>,
    action: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[],
  ): (context: unknown) => unknown {
    return async (context) => {
      const contextAccessor = new ContextAccessor(context, this.#platform);
      const diCache = this.#platform.diCache
        .createChild()
        .beginScope(Scope.Injection)
        .beginScope(Scope.Request);
      try {
        const { clone, fullSet } = this.#platform.container.deepClone();
        const scopedResolver = new DependencyResolver(clone, diCache);
        fullSet.forEach((container) => {
          container.registerValue(
            ContextAccessor,
            contextAccessor,
            Scope.Request,
          );
          container.registerValue(SCOPED_CONTAINER, clone, Scope.Request);
          container.registerValue(
            SCOPED_RESOLVER,
            scopedResolver,
            Scope.Request,
          );
        });
        const controllerInstance: Record<
          string,
          (...args: unknown[]) => Promise<unknown>
        > = await scopedResolver.resolve(controller);
        for (const item of new Set(diCache.items)) {
          await (item as Partial<OnRequestStart>)?.mvOnRequestStart?.(
            contextAccessor,
          );
        }
        const parameters = await this.buildParameters(
          scopedResolver,
          contextAccessor,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas,
        );
        const result = await this.executeFilters(
          context,
          scopedResolver,
          async () => await controllerInstance[action](...parameters),
          parameters,
          controllerMetadata,
          actionMetadata,
          parameterMetadatas,
        );
        for (const item of new Set(diCache.items)) {
          await (item as Partial<OnRequestEnd>)?.mvOnRequestEnd?.(
            contextAccessor,
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
        await this.handleError(err, contextAccessor);
      } finally {
        diCache.endScope(Scope.Injection);
        diCache.endScope(Scope.Request);
      }
    };
  }

  registerMiddleware(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#middlewareRegistry.push(middleware);
  }

  registerGlobalErrorHandler(errorHandler: ErrorHandler, priority?: number) {
    this.#globalErrorHandlers.push({ errorHandler, priority });
  }

  registerGlobalFilter(filter: MvFilter | Type<MvFilter>) {
    FilterCatalog.registerGlobalFilter(filter);
  }

  registerGlobalTransformer(transformer: MvTransformer | Type<MvTransformer>) {
    TransformerCatalog.registerGlobalTransformer(transformer);
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

  private async executeFilters(
    context: unknown,
    scopedResolver: DependencyResolver,
    executor: () => Promise<unknown>,
    parameters: unknown[],
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[],
  ) {
    const filters = await Promise.all(
      FilterCatalog.getFilters(
        controllerMetadata.type,
        actionMetadata.action,
      ).map(async (filter) =>
        typeof filter === "function"
          ? await scopedResolver.resolve<MvFilter>(filter)
          : filter
      ),
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
          parameterMetadatas?.map((parameterMetadata) => ({
            index: parameterMetadata.index,
            name: parameterMetadata.name,
            type: parameterMetadata.type,
          })),
        );
    }
    return await next();
  }

  private async handleError(err: unknown, contextAccessor: ContextAccessor) {
    for (const handler of this.getGlobalErrorHandlers()) {
      try {
        const result = await handler(err, contextAccessor);
        if (result && result.handled) {
          return;
        }
        // deno-lint-ignore no-empty
      } catch {}
    }
    if (err instanceof ServerException) {
      try {
        let content: string;
        if (err.content) {
          content = JSON.stringify(err.content);
        } else {
          content = JSON.stringify({
            errorCode: err.errorCode,
            description: err.errorDescription,
            message: err.message,
          });
        }
        contextAccessor.setBody(content);
        contextAccessor.setHeader("Content-Type", "application/json");
        contextAccessor.setStatus(err.errorCode);
        return;
        // deno-lint-ignore no-empty
      } catch {}
    }
    contextAccessor.setBody("An unknown error occurred");
    contextAccessor.setHeader("Content-Type", "text/plain");
    contextAccessor.setStatus(500);
  }

  private getGlobalErrorHandlers() {
    const handlers = Array.from(this.#globalErrorHandlers);

    handlers.sort((a, b) => a.priority ?? 0 - (b.priority ?? 0));

    return handlers.map((h) => h.errorHandler);
  }

  private getMiddleware() {
    return this.#middlewareRegistry.map((registration) =>
      typeof registration === "function"
        ? this.#platform.resolve<MvMiddleware>(registration)
        : registration
    );
  }

  private async buildParameters(
    scopedResolver: DependencyResolver,
    contextAccessor: ContextAccessor,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    parameterMetadatas?: ParameterMetadata[],
  ) {
    const parameters: unknown[] = [];
    for (const parameterMetadata of parameterMetadatas ?? []) {
      const valueProvider = ValueProviderCatalog.getValueProvider(
        controllerMetadata.type,
        actionMetadata.action,
        parameterMetadata.index,
      );
      const transformers = TransformerCatalog.getTransformers(
        controllerMetadata.type,
        actionMetadata.action,
        parameterMetadata.index,
      );
      if (!valueProvider) {
        continue;
      }
      let value = await valueProvider(
        contextAccessor,
        parameterMetadata,
        this.#platform,
      );
      for (const transformerType of transformers) {
        let transformer: MvTransformer;
        if (typeof transformerType === "function") {
          transformer = await scopedResolver.resolve<MvTransformer>(
            transformerType,
          );
        } else {
          transformer = transformerType;
        }
        value = transformer.transform(
          value,
          contextAccessor,
          parameterMetadata,
          actionMetadata,
          controllerMetadata,
        );
      }
      parameters[parameterMetadata.index] = value;
    }
    return parameters;
  }
}
