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

  getContext() {
    return this.#context;
  }
  async getUrl() {
    return (await this.#platform.getContextItem("url", this.#context)) as URL;
  }
  async getRequest() {
    return await this.#platform.getContextItem("request", this.#context);
  }
  async getResponse() {
    return await this.#platform.getContextItem("response", this.#context);
  }
  async getBody(name?: string) {
    return await this.#platform.getContextItem("body", this.#context, name);
  }
  async setBody(value: unknown) {
    await this.#platform.setContextItem("body", this.#context, value);
  }
  async getParameter(name: string) {
    return (await this.#platform.getContextItem(
      "parameter",
      this.#context,
      name
    )) as string;
  }
  async getQuery(name: string) {
    return (await this.#platform.getContextItem(
      "query",
      this.#context,
      name
    )) as string;
  }
  async getCookie(name: string) {
    return (await this.#platform.getContextItem(
      "cookie",
      this.#context,
      name
    )) as string;
  }
  async setCookie(name: string, value: string) {
    await this.#platform.setContextItem("cookie", this.#context, value, name);
  }
  async getHeader(name: string) {
    return (await this.#platform.getContextItem(
      "header",
      this.#context,
      name
    )) as string;
  }
  async setHeader(name: string, value: string) {
    await this.#platform.setContextItem("header", this.#context, value, name);
  }
  async sendFile(path: string) {
    await this.#platform.sendFile(this.#context, path);
  }
}

ScopeCatalog.root().registerScopeIdentifier(ContextAccessor, Scope.Request);
