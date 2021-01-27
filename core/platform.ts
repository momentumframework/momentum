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
  ScopeCatalog,
  Type,
  TypeIdentifier,
} from "./deps.ts";
import { OnPlatformBootstrap } from "./lifecycle-events.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";
import { MvFilter } from "./mv-filter.ts";
import { MvMiddleware } from "./mv-middleware.ts";
import { ServerController } from "./server-controller.ts";

function isCustomScope(scopeIdentifier: unknown) {
  return Object.values(Scope).every((scope) => scope !== scopeIdentifier);
}

export function platformMomentum() {
  return new MomentumPlatform(
    DiContainer.root().createChild(),
    ScopeCatalog.root().createChild()
  );
}

export abstract class Platform {
  #module?: ModuleRef;
  #container: DiContainer;
  #scopeCatalog: ScopeCatalog;
  #dependencyScopes = new Map<unknown, DependencyScope>();

  constructor(container: DiContainer, scopeCatalog: ScopeCatalog) {
    this.#container = container;
    this.#scopeCatalog = scopeCatalog;
    this.#dependencyScopes.set(
      Scope.Singleton,
      DependencyScope.beginScope(Scope.Singleton, this.#scopeCatalog)
    );
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

  setScope(typeIdentifier: TypeIdentifier, scope: Scope) {
    this.#scopeCatalog.registerScopeIdentifier(typeIdentifier, scope);
  }

  registerCustomScope(dependencyScope: DependencyScope) {
    if (!isCustomScope(dependencyScope.identifier)) {
      throw new Error(
        `${dependencyScope.identifier} is not a custom scope and cannot be registered`
      );
    }
    if (this.dependencyScopes.has(dependencyScope.identifier)) {
      throw new Error(
        `Custom scope ${dependencyScope.identifier} is already registered`
      );
    }
    this.#dependencyScopes.set(dependencyScope.identifier, dependencyScope);
  }

  deregisterCustomScope(dependencyScope: DependencyScope) {
    if (!isCustomScope(dependencyScope.identifier)) {
      throw new Error(
        `${dependencyScope.identifier} is not a custom scope and cannot be deregistered`
      );
    }
    this.#dependencyScopes.delete(dependencyScope.identifier);
  }

  resolve<T = unknown>(
    identifier: TypeIdentifier,
    dependencyScope: DependencyScope = new CompositDependencyScope(
      this.#dependencyScopes
    )
  ) {
    this.ensureInitalized();
    return this.module.resolve<T>(identifier, dependencyScope);
  }

  async bootstrapModule(moduleType: ModuleClass) {
    try {
      await this.preBootstrap();
      this.#container.registerValue(PLATFORM, this);
      this.#module = await ModuleRef.createModuleRef(
        this.#container,
        ModuleCatalog.getMetadata(moduleType),
        this.#scopeCatalog,
        new CompositDependencyScope(this.#dependencyScopes)
      );
      await this.postBootstrap();
      return this;
    } catch (err) {
      throw err;
    }
  }

  async preBootstrap(): Promise<void> {}
  async postBootstrap(): Promise<void> {
    const uniqueItems = [
      ...new Set(
        [...this.#dependencyScopes].flatMap(
          ([_, dependencyScope]) => dependencyScope.items
        )
      ),
    ];
    for (const item of uniqueItems) {
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

  constructor(container: DiContainer, scopeCatalog: ScopeCatalog) {
    super(container, scopeCatalog);
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
