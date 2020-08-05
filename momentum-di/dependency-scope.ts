import { TypeIdentifier } from "./di-container.ts";

export class DependencyScope {
  #isEnded = false;
  // deno-lint-ignore no-explicit-any
  #cache = new Map<TypeIdentifier, any>();

  constructor(private parent?: DependencyScope) {
  }

  static beginScope() {
    return new DependencyScope();
  }

  beginSubScope() {
    return new DependencyScope(this);
  }

  endScope() {
    this.#cache.clear();
  }

  set(identifier: TypeIdentifier, obj: unknown) {
    if (this.#isEnded) {
      throw Error("Scope is ended");
    }
    this.#cache.set(identifier, obj);
  }

  get(identifier: TypeIdentifier) {
    if (this.#isEnded) {
      throw Error("Scope is ended");
    }
    let obj = this.#cache.get(identifier);
    if (!obj && this.parent) {
      obj = this.parent.get(identifier);
    }
    return obj;
  }
}
