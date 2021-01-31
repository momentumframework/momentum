export class MultikeyMap<TKey1, TKey2, TValue> {
  readonly #map = new Map<TKey1, Map<TKey2, TValue>>();
  constructor(entries?: [TKey1, TKey2, TValue][]) {
    entries?.forEach(([key1, key2, value]) => this.set(key1, key2, value));
  }
  get size() {
    return Array.from(this.#map.values()).reduce(
      (accum, map) => accum + map.size,
      0
    );
  }
  has(key1: TKey1, key2: TKey2) {
    const map = this.#map.get(key1);
    if (!map) {
      return false;
    }
    return this.#map.get(key1)?.has(key2);
  }
  get(key1: TKey1, key2: TKey2) {
    if (this.#map.has(key1)) {
      return this.#map.get(key1)?.get(key2);
    }
  }
  set(key1: TKey1, key2: TKey2, value: TValue) {
    let map = this.#map.get(key1);
    if (!map) {
      map = new Map();
      this.#map.set(key1, map);
    }
    map.set(key2, value);
  }
  delete(key1: TKey1, key2: TKey2) {
    const map = this.#map.get(key1);
    if (!map) {
      return;
    }
    map.delete(key2);
  }
  clear() {
    this.#map.clear();
  }
  *entries(): Generator<[TKey1, TKey2, TValue]> {
    for (const [key1, map] of this.#map.entries()) {
      for (const [key2, value] of map) {
        yield [key1, key2, value];
      }
    }
  }
  *keys(): Generator<[TKey1, TKey2]> {
    for (const [key1, map] of this.#map.entries()) {
      for (const [key2, _] of map) {
        yield [key1, key2];
      }
    }
  }
  *values(): Generator<TValue> {
    for (const [_, map] of this.#map.entries()) {
      for (const [_, value] of map) {
        yield value;
      }
    }
  }
  forEach(callbackFn: (value: TValue, key1: TKey1, key2: TKey2) => void) {
    for (const [key1, map] of this.#map.entries()) {
      for (const [key2, value] of map) {
        callbackFn(value, key1, key2);
      }
    }
  }
}
