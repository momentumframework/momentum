import { TypeIdentifier } from "./mod.ts";

export class ScopeCatalog {
  private static rootScopeCatalog?: ScopeCatalog;

  readonly #catalog = new Map<TypeIdentifier, unknown>();
  readonly #parent?: ScopeCatalog;

  private constructor(parent?: ScopeCatalog) {
    this.#parent = parent;
  }

  static root() {
    if (!this.rootScopeCatalog) {
      this.rootScopeCatalog = new ScopeCatalog();
    }
    return this.rootScopeCatalog;
  }

  createChild() {
    return new ScopeCatalog(this);
  }

  registerScopeIdentifier(
    typeIdentifier: TypeIdentifier,
    scopeIdentifier: unknown
  ) {
    this.#catalog.set(typeIdentifier, scopeIdentifier);
  }

  getScopeIdentifier(typeIdentifier: TypeIdentifier) {
    let scopeIdentifier = this.#catalog.get(typeIdentifier);
    if (!scopeIdentifier) {
      scopeIdentifier = this.#parent?.getScopeIdentifier(typeIdentifier);
    }
    return scopeIdentifier;
  }
}
