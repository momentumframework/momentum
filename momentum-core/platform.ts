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

export function platformMomentum(moduleType: ModuleClass) {
  const platform = new MomentumPlatform(
    DiContainer.root(),
    DependencyScope.beginScope()
  );
  platform.bootstrapModule(moduleType);
  return platform;
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

  async bootstrapModule(moduleType: ModuleClass): Promise<void> {
    try {
      this.#module = ModuleRef.createModuleRef(
        this.#container,
        ModuleCatalog.getMetadata(moduleType),
        this.#scope
      );
      await this.preInit();
      await this.#httpController.initialize();
      await this.postInit();
    } catch (err) {
      throw err;
    }
  }

  abstract preInit(): Promise<void>;
  abstract postInit(): Promise<void>;
  abstract addRouteHandler(
    controller: ControllerClass,
    action: string,
    route: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    handler: (context: unknown) => unknown
  ): Promise<void>;
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
  ): Promise<unknown>;
  abstract listen(port: number): Promise<void>;

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

class MomentumPlatform extends Platform {
  // deno-lint-ignore require-await
  async preInit() {
    throw new Error("Method not implemented.");
  }
  // deno-lint-ignore require-await
  async postInit() {
    throw new Error("Method not implemented.");
  }
  // deno-lint-ignore require-await
  async addRouteHandler() {
    throw new Error("Method not implemented.");
  }
  // deno-lint-ignore require-await
  async extractFromContext() {
    return undefined;
  }
  // deno-lint-ignore require-await
  async listen() {
    throw new Error("Method not implemented.");
  }
}
