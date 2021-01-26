import { PLATFORM } from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import {
  CompositDependencyScope,
  DependencyScope,
  DiContainer,
  Scope,
  Type,
  TypeIdentifier,
} from "./deps.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { MvPlatformBootstrap } from "./mv-platform-bootstrap.ts";
import { ServerController } from "./server-controller.ts";

export function platformMomentum() {
  return new MomentumPlatform(DiContainer.root(), DependencyScope.beginScope());
}

export abstract class Platform {
  #module?: ModuleRef;
  #container: DiContainer;
  #dependencyScopes = new Map<unknown, DependencyScope>();

  constructor(rootContainer: DiContainer, dependencyScopes: DependencyScope) {
    this.#container = rootContainer.createChild();
    this.#dependencyScopes.set(Scope.Singleton, dependencyScopes);
  }

  get module() {
    this.ensureInitalized();
    return this.#module as ModuleRef;
  }
  get container() {
    this.ensureInitalized();
    return this.module.diContainer;
  }

  get dependencyScopes() {
    return new Map([...this.#dependencyScopes]);
  }

  registerCustomScope(
    scopeIdentifier: unknown,
    dependencyScope: DependencyScope
  ) {
    this.#dependencyScopes.set(scopeIdentifier, dependencyScope);
  }

  resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope: DependencyScope = new CompositDependencyScope(this.#dependencyScopes)
  ) {
    this.ensureInitalized();
    return this.module.resolve<T>(identifier, scope);
  }

  async bootstrapModule(moduleType: ModuleClass) {
    try {
      await this.preBootstrap();
      this.#container.registerValue(PLATFORM, this);
      this.#module = await ModuleRef.createModuleRef(
        this.#container,
        ModuleCatalog.getMetadata(moduleType),
        new CompositDependencyScope(this.#dependencyScopes)
      );
      await this.postBootstrap();
      this.executeBootstrapLifecycleEvent(this.module);
      return this;
    } catch (err) {
      throw err;
    }
  }

  executeBootstrapLifecycleEvent(module: ModuleRef) {
    (module.instance as MvPlatformBootstrap).onPlatformBootstrap?.();
    for (const submodule of module.modules) {
      this.executeBootstrapLifecycleEvent(submodule);
    }
  }

  async preBootstrap(): Promise<void> {}
  async postBootstrap(): Promise<void> {}

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

export abstract class ServerPlatform extends Platform {
  #serverController: ServerController;

  constructor(container: DiContainer, scope: DependencyScope) {
    super(container, scope);
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
    kind: "body" | "cookie" | "header",
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
