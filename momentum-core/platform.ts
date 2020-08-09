import { DependencyScope, DiContainer, TypeIdentifier } from "./deps.ts";

import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleClass } from "./module-metadata.ts";
import { ModuleRef } from "./module-ref.ts";

export function platformMomentum() {
  return new Platform(DiContainer.root(), DependencyScope.beginScope());
}

export class Platform {
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

  bootstrapModule(moduleType: ModuleClass): Promise<this> {
    return new Promise((resolve, reject) => {
      try {
        this.#module = ModuleRef.createModuleRef(
          this.#container,
          ModuleCatalog.getMetadata(moduleType),
          this.#scope,
        );
        resolve(this);
      } catch (err) {
        reject(err);
      }
    });
  }

  private ensureInitalized() {
    if (!this.#module) {
      throw new Error("Platform has not been bootstrapped");
    }
  }
}
