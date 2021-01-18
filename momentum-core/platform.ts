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
  #httpController: HttpController;

  constructor(container: DiContainer, scope: DependencyScope) {
    this.#container = container;
    this.#scope = scope;
    this.#httpController = new HttpController(this);
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
      this.#module = ModuleRef.createModuleRef(
        this.#container,
        ModuleCatalog.getMetadata(moduleType),
        this.#scope
      );
      await this.preInit();
      await this.#httpController.initialize();
      await this.postInit();
      return this;
    } catch (err) {
      throw err;
    }
  }

  abstract preInit(): void | Promise<void>;
  abstract postInit(): void | Promise<void>;
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
  abstract listen(port: number): void | Promise<void>;

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

class MomentumPlatform extends Platform {
  preInit() {}
  postInit() {}
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
