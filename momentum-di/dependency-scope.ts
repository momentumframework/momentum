import { EventEmitter } from "./deps.ts";
import { TypeIdentifier } from "./di-container.ts";

export class DependencyScope {
  // deno-lint-ignore no-explicit-any
  #cache = new Map<TypeIdentifier, any>();
  #events = new EventEmitter<{ end(): void }>();
  #isEnded = false;

  constructor(private parent?: DependencyScope) {
    if (parent) {
      parent.#events.on("end", () => this.endScope());
    }
  }

  get isEnded() {
    return this.#isEnded;
  }

  static beginScope() {
    return new DependencyScope();
  }

  beginChildScope() {
    this.ensureScope();
    return new DependencyScope(this);
  }

  endScope() {
    this.ensureScope();
    this.#isEnded = true;
    this.#cache.clear();
    this.#events.emit("end");
  }

  set(identifier: TypeIdentifier, obj: unknown) {
    this.ensureScope();
    this.#cache.set(identifier, obj);
  }

  get(identifier: TypeIdentifier) {
    this.ensureScope();
    let obj = this.#cache.get(identifier);
    if (!obj && this.parent) {
      obj = this.parent.get(identifier);
    }
    return obj;
  }

  private ensureScope() {
    if (this.#isEnded) {
      throw Error("Scope is ended");
    }
  }
}
