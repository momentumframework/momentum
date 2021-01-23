import { Deferred } from "./deferred.ts";

export class DeferredImpl implements Deferred {
  #value: unknown;
  readonly #getter: () => unknown;
  constructor(getter: () => unknown) {
    this.#getter = getter;
  }
  async value() {
    if (!this.#value) {
      this.#value = await this.#getter();
    }
    return this.#value;
  }
}
