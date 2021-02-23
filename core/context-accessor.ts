import { ServerPlatform } from "./platform.ts";

/**
 * Wraps the platform specific context object with a standard interface
 */
export class ContextAccessor {
  #context: unknown;
  #platform: ServerPlatform;
  constructor(context: unknown, platform: ServerPlatform) {
    this.#context = context;
    this.#platform = platform;
  }

  /**
   * Get the underlying platform context object
   */
  getContext() {
    return this.#context;
  }

  /**
   * Get the requested URL
   */
  async getUrl() {
    return (await this.#platform.getContextItem("url", this.#context)) as URL;
  }

  /**
   * Get the underlying platform request object
   */
  async getRequest() {
    return await this.#platform.getContextItem("request", this.#context);
  }

  /**
   * Get the underlying platform response object
   */
  async getResponse() {
    return await this.#platform.getContextItem("response", this.#context);
  }

  /**
   * Get the request body
   */
  async getBody(): Promise<unknown>;
  /**
   * Get a field from the request body
   */
  async getBody(name: string | undefined): Promise<unknown>;
  async getBody(name?: string) {
    return await this.#platform.getContextItem("body", this.#context, name);
  }

  /**
   * Set the response body
   */
  async setBody(value: unknown) {
    await this.#platform.setContextItem("body", this.#context, value);
  }

  /**
   * Get a parameter from the requested route
   */
  async getParameter(name: string) {
    return (await this.#platform.getContextItem(
      "parameter",
      this.#context,
      name,
    )) as string;
  }

  /**
   * Get an item from the request query string
   */
  async getQuery(name: string) {
    return (await this.#platform.getContextItem(
      "query",
      this.#context,
      name,
    )) as string;
  }

  /**
   * Get a cookie from the request
   */
  async getCookie(name: string) {
    return (await this.#platform.getContextItem(
      "cookie",
      this.#context,
      name,
    )) as string;
  }

  /**
   * Get a state item from the context
   */
  async getState(name: string) {
    return await this.#platform.getContextItem("state", this.#context, name);
  }

  /**
   * Get a request state item from the context
   */
  async getRequestState(name: string) {
    return await this.#platform.getContextItem(
      "requestState",
      this.#context,
      name,
    );
  }

  /**
   * Set a cookie on the response
   */
  async setCookie(name: string, value: string, options?: unknown) {
    await this.#platform.setContextItem(
      "cookie",
      this.#context,
      value,
      name,
      options,
    );
  }

  /**
   * Get the value of a request header
   */
  async getHeader(name: string) {
    return (await this.#platform.getContextItem(
      "header",
      this.#context,
      name,
    )) as string;
  }

  /**
   * Set a header on the response
   */
  async setHeader(name: string, value: string) {
    await this.#platform.setContextItem("header", this.#context, value, name);
  }

  /**
   * Set a status code on the response
   */
  async setStatus(status: number) {
    await this.#platform.setContextItem("status", this.#context, status);
  }

  /**
   * Set a state item on the context
   */
  async setState(name: string, value: unknown) {
    await this.#platform.setContextItem("state", this.#context, value, name);
  }

  /**
   * Set a request state item on the context
   */
  async setRequestState(name: string, value: unknown) {
    await this.#platform.setContextItem(
      "requestState",
      this.#context,
      value,
      name,
    );
  }

  /**
   * Set a file as a response
   */
  async sendFile(path: string) {
    await this.#platform.sendFile(this.#context, path);
  }
}
