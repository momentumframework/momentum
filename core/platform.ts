import { DiCache } from "../di/di-cache.ts";
import {
  LOGGING_FILTER,
  LOGGING_FORMATTER,
  LOGGING_PROVIDER,
  PLATFORM,
} from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import { DiContainer, Scope, Type, TypeIdentifier } from "./deps.ts";
import { OnPlatformBootstrap } from "./lifecycle-events.ts";
import { Logger } from "./logger.ts";
import { LoggingFilter } from "./logging-filter.ts";
import { LoggingFormatter } from "./logging-formatter.ts";
import { LoggingProvider } from "./logging-provider.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { MvTransformer } from "./mv-transformer.ts";
import { ErrorHandler, ServerController } from "./server-controller.ts";

/**
 * Creates a new basic momentum platform
 * 
 * @returns {MomentumPlatform}
 * 
 * @remarks
 * ## Example
 * 
 * ```typescript
 * const platform = await platformMomentum().bootstrapModule(AppModule)
 * ```
 */
export function platformMomentum() {
  return new MomentumPlatform(DiContainer.root().createChild("platform"));
}

/**
 * The Momentum platform is the entry point for every Momentum application. 
 * Each application has exactly one platform and services are bound the scope of the platform.
 */
export abstract class Platform {
  readonly #diCache = new DiCache().beginScope(Scope.Singleton);
  readonly #container: DiContainer;
  #module?: ModuleRef;

  protected logger!: Logger;

  constructor(container: DiContainer) {
    this.#container = container;
  }

  /**
   * Get the platforms entry module
   * 
   * @returns {ModuleRef}
   */
  get module() {
    this.ensureInitialized();
    return this.#module as ModuleRef;
  }

  /**
   * Get the platforms root dependency injection container
   * 
   * @returns {DiContainer}
   */
  get container() {
    this.ensureInitialized();
    return this.module.diContainer;
  }

  /**
   * Get the platforms dependency injection cache
   * 
   * @returns {DiCache}
   */
  get diCache() {
    return this.#diCache;
  }

  /**
   * Resolves an instance of @see TReturn
   * 
   * @param identifier type identifer to create an instance of
   * 
   * @typeParam TReturn - return type
   * 
   * @returns {Promise<TReturn>}
   */
  resolve<TReturn = unknown>(identifier: TypeIdentifier) {
    this.ensureInitialized();
    return this.module.resolve<TReturn>(identifier, this.diCache);
  }

  /**
   * Bootstrap a Momentum application on a given platform.
   * 
   * @param moduleType Module type to bootstrap
   * 
   * @remarks
   * ## Example
   * ```typescript
   * const platform = await platformMomentum().bootstrapModule(AppModule);
   * ```
   */
  async bootstrapModule(moduleType: ModuleClass) {
    await this.preBootstrap();
    this.#container.registerValue(PLATFORM, this);
    this.#module = await ModuleRef.createModuleRef(
      ModuleCatalog.getMetadata(moduleType),
      this.#container.createChild(moduleType.name),
      this.#diCache,
    );
    this.logger = await this.resolve(Logger);
    this.logger.namespace = "Momentum";
    this.logger.loggerName = "Internal";
    this.logger.info(`Initializing platform`);
    this.#module.diContainer.preCompileDependencyGraph(true);
    await this.postBootstrap();
    this.logger.info(`Completed initializing platform`);
    return this;
  }

  /**
   * Register a global logging provider. 
   */
  registerGlobalLoggingProvider(
    loggingProvider: LoggingProvider | Type<LoggingProvider>,
  ) {
    if (typeof loggingProvider === "function") {
      this.#container.registerAlias(loggingProvider, LOGGING_PROVIDER);
    } else {
      this.#container.registerValue(LOGGING_PROVIDER, loggingProvider);
    }
    return this;
  }

  /**
   * Register a global logging filter. 
   */
  registerGlobalLoggingFilter(
    loggingFilter: LoggingFilter | Type<LoggingFilter>,
  ) {
    if (typeof loggingFilter === "function") {
      this.#container.registerAlias(loggingFilter, LOGGING_FILTER);
    } else {
      this.#container.registerValue(LOGGING_FILTER, loggingFilter);
    }
    return this;
  }

  /**
   * Register a global logging formatter. 
   */
  registerGlobalLoggingFormatter(
    loggingFormatter: LoggingFormatter | Type<LoggingFormatter>,
  ) {
    if (typeof loggingFormatter === "function") {
      this.#container.registerAlias(loggingFormatter, LOGGING_FORMATTER);
    } else {
      this.#container.registerValue(LOGGING_FORMATTER, loggingFormatter);
    }
    return this;
  }

  async preBootstrap(): Promise<void> {}
  async postBootstrap(): Promise<void> {
    for (const item of new Set(this.#diCache.items)) {
      await (item as Partial<OnPlatformBootstrap>)?.mvOnPlatformBootstrap?.();
    }
  }

  private ensureInitialized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

/**
 * Momentum platform for server applications such as APIs and web applications.
 */
export abstract class ServerPlatform extends Platform {
  #serverController: ServerController;

  constructor(container: DiContainer) {
    super(container);
    this.#serverController = new ServerController(this);
  }

  async postBootstrap() {
    await this.#serverController.initialize(this.logger);
    await super.postBootstrap();
  }

  abstract addRouteHandler(
    controller: ControllerClass,
    action: string,
    route: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    handler: (context: unknown) => unknown,
  ): void | Promise<void>;

  abstract addMiddlewareHandler(
    handler: (context: unknown) => Promise<boolean>,
  ): void | Promise<void>;

  abstract getContextItem(
    kind:
      | "url"
      | "parameter"
      | "query"
      | "body"
      | "cookie"
      | "header"
      | "request"
      | "response",
    context: unknown,
    identifier?: unknown,
  ): Promise<unknown>;

  abstract setContextItem(
    kind: "body" | "status" | "cookie" | "header" | "status",
    context: unknown,
    value: unknown,
    identifier?: unknown,
  ): void | Promise<void>;

  abstract sendFile(context: unknown, path: string): void | Promise<void>;

  /**
   * Provide middleware into the application. 
   * The middleware can either be an instance of a @see MvMiddleware or a type that 
   * implements @see MvMiddleware which will be resolved by the platform resolver. 
   * 
   * @remarks
   * Middleware will be executed immediately before a request is processed.
   */
  use(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#serverController.registerMiddleware(middleware);
    return this;
  }

  /**
   * Register a filter globally. The filter can either be an instance 
   * of @see MvFilter or a type that implements @see MvFilter which will be resolved by the platform resolver. 
   * 
   * @remarks
   * Filters are executed within the request pipeline and can be used to 
   * modify or cancel the results of a request, or simply hook into the pipeline. 
   */
  registerGlobalFilter(filter: MvFilter | Type<MvFilter>) {
    this.#serverController.registerGlobalFilter(filter);
    return this;
  }

  /**
   * Register a transformer globally. The transformer can either be an instance 
   * of @see MvFilter or a type that implements @see MvFilter which will be resolved by the request scoped resolver.    * 
   */
  registerGlobalTransformer(transformer: MvTransformer | Type<MvTransformer>) {
    this.#serverController.registerGlobalTransformer(transformer);
    return this;
  }

  /**
   * Register a global error handler.
   * 
   * @param errorHandler error handler callback function
   * @param priority execution priority of the handler
   * 
   * @remarks
   * This will execute when a unhandled exception occurs within the request pipeline. 
   * An error handler can return ```{handled: true}``` to stop the processing of subsequent error handlers.
   */
  registerGlobalErrorHandler(errorHandler: ErrorHandler, priority?: number) {
    this.#serverController.registerGlobalErrorHandler(errorHandler, priority);
  }
}

export class MomentumPlatform extends Platform {}
