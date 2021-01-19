import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";
import { DependencyScope, DiContainer, TypeIdentifier } from "./deps.ts";
import { HttpController } from "./http-controller.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";

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
      this.#module = ModuleRef.createModuleRef(
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
  #httpController: HttpController;

  constructor(container: DiContainer, scope: DependencyScope) {
    super(container, scope);
    this.#httpController = new HttpController(this);
  }

  async preInit() {
    await this.#httpController.initialize();
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
}

class MomentumPlatform extends Platform {
  addRouteHandler() {
    throw new Error("Method not implemented.");
  }
  extractFromContext() {
    return undefined;
  }
  listen() {
    throw new Error("Method not implemented.");
  }
}
