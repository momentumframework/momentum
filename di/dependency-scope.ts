import { TypeIdentifier } from "./di-container.ts";
import { ScopeCatalog } from "./scope-catalog.ts";

export abstract class DependencyScope {
  readonly #cache = new Map<TypeIdentifier, unknown>();
  #isEnded = false;

  get isEnded() {
    return this.#isEnded;
  }

  static beginScope(): DependencyScope {
    return new StandardDependencyScope();
  }

  endScope() {
    this.#isEnded = true;
    this.#cache.clear();
  }

  protected ensureScope() {
    if (this.isEnded) {
      throw Error("Scope is ended");
    }
  }

  abstract set(identifier: TypeIdentifier, obj: unknown): void;

  abstract get<T = unknown>(identifier: TypeIdentifier): T | undefined;
}

class StandardDependencyScope extends DependencyScope {
  readonly #cache = new Map<TypeIdentifier, unknown>();

  set(identifier: TypeIdentifier, obj: unknown) {
    this.ensureScope();
    this.#cache.set(identifier, obj);
  }

  get<T = unknown>(identifier: TypeIdentifier) {
    this.ensureScope();
    return this.#cache.get(identifier) as T;
  }
}

export class CompositDependencyScope extends DependencyScope {
  readonly #scopes: Map<unknown, DependencyScope>;

  constructor(scopes: Map<unknown, DependencyScope>) {
    super();
    this.#scopes = scopes;
  }

  set(identifier: TypeIdentifier, obj: unknown) {
    super.ensureScope();
    this.getScope(identifier)?.set(identifier, obj);
  }

  get<T = unknown>(identifier: TypeIdentifier) {
    this.ensureScope();
    return this.getScope(identifier)?.get(identifier) as T;
  }

  private getScope(identifier: TypeIdentifier) {
    const scopeIdentifier = ScopeCatalog.getScopeIdentifier(identifier);
    return this.#scopes.get(scopeIdentifier);
  }
}
