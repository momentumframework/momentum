import { DiCache } from "../di/di-cache.ts";
import { PLATFORM } from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import { DiContainer, Scope, Type, TypeIdentifier } from "./deps.ts";
import { OnPlatformBootstrap } from "./lifecycle-events.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerController } from "./server-controller.ts";

export function platformMomentum() {
  return new MomentumPlatform(DiContainer.root().createChild("platform"));
}

export abstract class Platform {
  readonly #diCache = new DiCache().beginScope(Scope.Singleton);
  readonly #container: DiContainer;
  #module?: ModuleRef;

  constructor(container: DiContainer) {
    this.#container = container;
  }

  get module() {
    this.ensureInitalized();
    return this.#module as ModuleRef;
  }

  get container() {
    this.ensureInitalized();
    return this.module.diContainer;
  }

  get diCache() {
    return this.#diCache;
  }

  resolve<T = unknown>(identifier: TypeIdentifier) {
    this.ensureInitalized();
    return this.module.resolve<T>(identifier, this.diCache);
  }

  async bootstrapModule(moduleType: ModuleClass) {
    try {
      await this.preBootstrap();
      this.#container.registerValue(PLATFORM, this);
      this.#module = await ModuleRef.createModuleRef(
        ModuleCatalog.getMetadata(moduleType),
        this.#container.createChild(moduleType.name),
        this.#diCache
      );
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

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

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
    handler: (context: unknown) => unknown
  ): void | Promise<void>;

  abstract addMiddlewareHandler(
    handler: (context: unknown) => Promise<boolean>
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
    identifier?: unknown
  ): Promise<unknown>;

  abstract setContextItem(
    kind: "body" | "status" | "cookie" | "header" | "status",
    context: unknown,
    value: unknown,
    identifier?: unknown
  ): void | Promise<void>;

  abstract sendFile(context: unknown, path: string): void | Promise<void>;

  use(middleware: MvMiddleware | Type<MvMiddleware>) {
    this.#serverController.registerMiddleware(middleware);
    return this;
  }

  registerGlobalFilter(filter: MvFilter | Type<MvFilter>) {
    this.#serverController.registerGlobalFilter(filter);
    return this;
  }
}

export class MomentumPlatform extends Platform {}
