import { DiCache } from "../di/di-cache.ts";
import { PLATFORM } from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import { DiContainer, Scope, Type, TypeIdentifier } from "./deps.ts";
import { OnPlatformBootstrap } from "./lifecycle-events.ts";
import { MvTransformer } from "./mod.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
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
    try {
      await this.preBootstrap();
      this.#container.registerValue(PLATFORM, this);
      this.#module = await ModuleRef.createModuleRef(
        ModuleCatalog.getMetadata(moduleType),
        this.#container.createChild(moduleType.name),
        this.#diCache,
      );
      this.#module.diContainer.preCompileDependencyGraph(true);
      await this.postBootstrap();
      return this;
    } catch (err) {
      throw err;
    }
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
    await this.#serverController.initialize();
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
   * @remarks
   * This will execute when a unhandled exception occurs within the request pipeline. 
   * An error handler can return ```{handled: true}``` to stop the processing of subsequent error handlers.
   */
  registerGlobalErrorHandler(errorHandler: ErrorHandler) {
    this.#serverController.registerGlobalErrorHandler(errorHandler);
  }
}

export class MomentumPlatform extends Platform {}
