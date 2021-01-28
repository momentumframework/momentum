import { DiContainer, TypeIdentifier } from "./di-container.ts";
import { Scope } from "./scope.ts";

export class DiCache {
  readonly #parent?: DiCache;
  readonly #cache = new Map<
    Scope | string,
    Map<DiContainer, Map<TypeIdentifier, unknown>>
  >();

  constructor(parent?: DiCache) {
    this.#parent = parent;
  }

  createChild() {
    return new DiCache(this);
  }

  beginScope(scope: Scope | string) {
    if (!this.#cache.has(scope)) {
      this.#cache.set(scope, new Map());
    }
    return this;
  }

  endScope(scope: Scope | string) {
    if (this.#cache.has(scope)) {
      this.#cache.delete(scope);
    }
  }

  clear() {
    this.#cache.clear();
  }

  set(
    scope: Scope | string,
    diContainer: DiContainer,
    typeIdentifier: TypeIdentifier,
    value: unknown
  ) {
    const scopeCache = this.#cache.get(scope);
    if (scopeCache) {
      let diContextCache = scopeCache.get(diContainer);
      if (!diContextCache) {
        diContextCache = new Map();
        scopeCache.set(diContainer, diContextCache);
      }
      diContextCache.set(typeIdentifier, value);
    } else {
      this.#parent?.set(scope, diContainer, typeIdentifier, value);
    }
  }

  get<T = unknown>(
    diContainer: DiContainer,
    typeIdentifier: TypeIdentifier
  ): T | undefined {
    for (const [_, scopeCache] of this.#cache.entries()) {
      const diContextCache = scopeCache.get(diContainer);
      if (!diContextCache) {
        continue;
      }
      if (diContextCache.has(typeIdentifier)) {
        return diContextCache.get(typeIdentifier) as T;
      }
    }
    this.#parent?.get(diContainer, typeIdentifier) as T;
  }

  get items(): unknown[] {
    return [
      ...Array.from(this.#cache.values()).flatMap((diContextCache) =>
        Array.from(diContextCache.values()).flatMap((typeCache) =>
          Array.from(typeCache.values())
        )
      ),
      ...(this.#parent?.items ?? []),
    ];
  }
}
