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

  async preInit(): Promise<void> {}
  async postInit(): Promise<void> {}
  async listen(port: number) {}

  abstract addRouteHandler(
    controller: ControllerClass,
    action: string,
    route: string,
    controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    handler: (context: unknown) => unknown
  ): Promise<void>;

  abstract extractFromContext(
    kind: string,
    identifier: unknown,
    context: unknown
  ): Promise<unknown>;

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}

class MomentumPlatform extends Platform {
  // deno-lint-ignore require-await
  async addRouteHandler() {
    throw new Error("Method not implemented.");
  }
  // deno-lint-ignore require-await
  async extractFromContext() {
    return undefined;
  }
}
