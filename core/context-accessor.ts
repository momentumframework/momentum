import { Scope } from "../di/mod.ts";
import { ScopeCatalog } from "../di/scope-catalog.ts";
import { ServerPlatform } from "./platform.ts";

export class ContextAccessor {
  #context: unknown;
  #platform: ServerPlatform;
  constructor(context: unknown, platform: ServerPlatform) {
    this.#context = context;
    this.#platform = platform;
  }

  get context() {
    return this.#context;
  }
  get url() {
    return this.#platform.getContextItem("url", this.#context);
  }
  get request() {
    return this.#platform.getContextItem("request", this.#context);
  }
  get response() {
    return this.#platform.getContextItem("response", this.#context);
  }
  getBody(name?: string) {
    return this.#platform.getContextItem("body", this.#context, name);
  }
  getParameter(name: string) {
    return this.#platform.getContextItem("parameter", this.#context, name);
  }
  getQuery(name: string) {
    return this.#platform.getContextItem("query", this.#context, name);
  }
  getCookie(name: string) {
    return this.#platform.getContextItem("cookie", this.#context, name);
  }
  getHeader(name: string) {
    return this.#platform.getContextItem("header", this.#context, name);
  }
  setBody(name: string) {
    this.#platform.setContextItem("body", this.#context, name);
  }
  setCookie(name: string) {
    this.#platform.setContextItem("cookie", this.#context, name);
  }
  setHeader(name: string) {
    this.#platform.setContextItem("header", this.#context, name);
  }
}

ScopeCatalog.root().registerScopeIdentifier(ContextAccessor, Scope.Request);
