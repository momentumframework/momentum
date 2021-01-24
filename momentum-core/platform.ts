import { PLATFORM } from "./constants.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import { DependencyScope, DiContainer, Type, TypeIdentifier } from "./deps.ts";
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
  #singletonScope: DependencyScope;

  constructor(rootContainer: DiContainer, scope: DependencyScope) {
    this.#container = rootContainer.createChild();
    this.#singletonScope = scope;
  }

  get module() {
    this.ensureInitalized();
    return this.#module as ModuleRef;
  }
  get container() {
    this.ensureInitalized();
    return this.module.diContainer;
  }

  resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope: DependencyScope = this.#singletonScope
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
        this.#singletonScope
      );
      this.executeBootstrapLifecycleEvent(this.module);
      await this.postBootstrap();
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

export abstract class ServerPlatform<
  TListenOptions = unknown
> extends Platform {
  #serverController: ServerController;

  constructor(container: DiContainer, scope: DependencyScope) {
    super(container, scope);
    this.#serverController = new ServerController(this);
  }

  async preBootstrap() {
    await this.#serverController.initialize();
    await super.preBootstrap();
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

  abstract extractFromContext(
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
  ): unknown | Promise<unknown>;

  abstract listen(options: TListenOptions): void | Promise<void>;

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
