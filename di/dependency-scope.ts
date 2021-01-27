import { TypeIdentifier } from "./di-container.ts";
import { ScopeCatalog } from "./scope-catalog.ts";
import { EventEmitter } from "./deps.ts";

export abstract class DependencyScope {
  readonly #events = new EventEmitter<{ end(): void }>();
  readonly #identifier: unknown;
  readonly #parent?: DependencyScope;
  readonly #scopeCatalog: ScopeCatalog;

  #isEnded = false;

  constructor(
    scopeCatalog: ScopeCatalog,
    identifier?: unknown,
    parent?: DependencyScope
  ) {
    this.#scopeCatalog = scopeCatalog;
    this.#identifier = identifier;
    if (parent) {
      this.#parent = parent;
      parent.#events.on("end", () => this.endScope());
    }
  }

  get identifier() {
    return this.#identifier;
  }

  get parent() {
    return this.#parent;
  }

  get isEnded() {
    return this.#isEnded;
  }

  static beginScope(
    identifier: unknown,
    scopeCatalog = ScopeCatalog.root()
  ): DependencyScope {
    return new StandardDependencyScope(scopeCatalog, identifier);
  }

  beginChildScope(identifier: unknown, scopeCatalog = ScopeCatalog.root()) {
    this.ensureScope();
    return new StandardDependencyScope(scopeCatalog, identifier, this);
  }

  endScope() {
    this.ensureScope();
    this.#isEnded = true;
    this.#events.emit("end");
  }

  abstract set(typeIdentifier: TypeIdentifier, obj: unknown): void;

  abstract get<T = unknown>(typeIdentifier: TypeIdentifier): T | undefined;

  protected ensureScope() {
    if (this.#isEnded) {
      throw Error("Scope is ended");
    }
  }
}

class StandardDependencyScope extends DependencyScope {
  readonly #cache = new Map<TypeIdentifier, unknown>();

  set(typeIdentifier: TypeIdentifier, obj: unknown) {
    this.ensureScope();
    const scopeIdentifier = ScopeCatalog.root().getScopeIdentifier(
      typeIdentifier
    );
    if (scopeIdentifier === this.identifier) {
      this.#cache.set(typeIdentifier, obj);
    } else {
      this.parent?.set(typeIdentifier, obj);
    }
  }

  get<T = unknown>(typeIdentifier: TypeIdentifier): T | undefined {
    this.ensureScope();
    let obj = this.#cache.get(typeIdentifier) as T | undefined;
    if (!obj) {
      obj = this.parent?.get<T>(typeIdentifier);
    }
    return obj;
  }

  endScope() {
    this.#cache.clear();
    super.endScope();
  }
}

export class CompositDependencyScope extends DependencyScope {
  readonly #scopes: Map<unknown, DependencyScope>;

  constructor(scopes: Map<unknown, DependencyScope>) {
    super(ScopeCatalog.root());
    this.#scopes = scopes;
  }

  set(typeIdentifier: TypeIdentifier, obj: unknown) {
    super.ensureScope();
    for (const scope of this.#scopes.values()) {
      scope.set(typeIdentifier, obj);
    }
  }

  get<T = unknown>(typeIdentifier: TypeIdentifier): T | undefined {
    this.ensureScope();
    for (const scope of this.#scopes.values()) {
      const obj = scope.get(typeIdentifier);
      if (obj) {
        return obj as T;
      }
    }
  }
}
