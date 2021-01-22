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
import { ServerController } from "./server-controller.ts";

export function platformMomentum() {
  return new MomentumPlatform(DiContainer.root(), DependencyScope.beginScope());
}

export abstract class Platform {
  #module?: ModuleRef;
  #container: DiContainer;
  #scope: DependencyScope;

  constructor(container: DiContainer, scope: DependencyScope) {
    this.#container = container;
    this.#scope = scope;
  }

  get module() {
    this.ensureInitalized();
    return this.#module as ModuleRef;
  }
  get container() {
    this.ensureInitalized();
    return this.#container;
  }

  get scope() {
    this.ensureInitalized();
    return this.#scope;
  }

  resolve<T = unknown>(identifier: TypeIdentifier) {
    return this.module.resolve<T>(identifier, this.scope);
  }

  async bootstrapModule(moduleType: ModuleClass) {
    try {
      await this.preInit();
      this.#module = await ModuleRef.createModuleRef(
        this.#container,
        ModuleCatalog.getMetadata(moduleType),
        this.#scope
      );
      await this.postInit();
      return this;
    } catch (err) {
      throw err;
    }
  }

  async preInit(): Promise<void> {}
  async postInit(): Promise<void> {}

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

export interface ServerListenOptions {
  port: number;
}

export abstract class ServerPlatform extends Platform {
  #serverController: ServerController;

  constructor(container: DiContainer, scope: DependencyScope) {
    super(container, scope);
    this.#serverController = new ServerController(this);
  }

  async preInit() {
    await this.#serverController.initialize();
    await super.preInit();
  }

  abstract addRouteHandler(
    controller: ControllerClass,
    action: string,
    route: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    handler: (context: unknown) => unknown
  ): void | Promise<void>;

  abstract extractFromContext(
    kind:
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

  abstract listen(options: ServerListenOptions): void | Promise<void>;

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
