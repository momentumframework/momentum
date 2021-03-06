import {
  ActionMetadata,
  Application,
  ControllerClass,
  ControllerMetadata,
  DiContainer,
  FormDataBody,
  helpers as oakHelpers,
  ListenOptions,
  Router,
  RouterContext,
  ServerPlatform,
} from "./deps.ts";

/**
 * Creates a new Oak platform
 * 
 * @returns {OakPlatform}
 * 
 * @remarks
 * ## Example
 * 
 * ```typescript
 * await platformOak()
 *   .bootstrapModule(AppModule)
 *   .then((platform) => platform.listen({ port: 3000 }));
 * ```
 */
export function platformOak(): OakPlatform;
/**
 * Creates a new oak platform with customizable application and router
 * 
 * @param app The Oak Application. Provide this parameter to register Oak middleware
 * @param router The Oak Router. Provide this parameter to customize routing
 * 
 * @returns {OakPlatform}
 * 
 * @remarks
 * ## Example
 * ```typescript
 * const application = new Application();
 * const router = new Router();
 * 
 * // Install middleware of set up custom routes
 * 
 * await platformOak(application, router)
 *   .bootstrapModule(AppModule)
 *   .then((platform) => platform.listen({ port: 3000 }));
 * ```
 */
export function platformOak(app: Application, router: Router): OakPlatform;
export function platformOak(
  app: Application = new Application(),
  router: Router = new Router(),
) {
  return new OakPlatform(
    DiContainer.root().createChild("platform"),
    app,
    router,
  );
}

export class OakPlatform extends ServerPlatform {
  #app: Application;
  #router: Router;
  constructor(
    container: DiContainer,
    application: Application,
    router: Router,
  ) {
    super(container);
    this.#app = application;
    this.#router = router;
  }

  async postBootstrap() {
    this.#app.addEventListener("listen", ({ hostname, port, secure }) => {
      this.logger.log([
        `PlatformOak listening on `,
        secure ? "https://" : "http://",
        hostname ?? "localhost",
        `:${port}`,
      ].join(""));
    });
    await super.postBootstrap();
    this.#app.use(this.#router.routes());
  }

  addRouteHandler(
    _controller: ControllerClass,
    _action: string,
    route: string,
    _controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    // deno-lint-ignore no-explicit-any
    handler: (context: RouterContext) => any,
  ) {
    const routeHandler = async (context: RouterContext) => {
      const result = await handler(context);
      if (result) {
        context.response.body = result;
      }
    };
    switch (actionMetadata.method) {
      case "get":
        this.#router.get(route, routeHandler);
        break;
      case "post":
        this.#router.post(route, routeHandler);
        break;
      case "put":
        this.#router.put(route, routeHandler);
        break;
      case "delete":
        this.#router.delete(route, routeHandler);
        break;
      case "head":
        this.#router.head(route, routeHandler);
        break;
      case "patch":
        this.#router.patch(route, routeHandler);
        break;
    }
  }

  addMiddlewareHandler(handler: (context: unknown) => Promise<boolean>) {
    this.#app.use(async (context, next) => {
      if (await handler(context)) {
        await next();
      }
    });
  }

  async getContextItem(
    kind:
      | "url"
      | "parameter"
      | "query"
      | "body"
      | "cookie"
      | "header"
      | "state"
      | "requestState"
      | "request"
      | "response",
    context: RouterContext,
    identifier: string,
  ) {
    switch (kind) {
      case "url":
        return context.request.url;
      case "parameter":
        return context.params[identifier];
      case "query":
        return oakHelpers.getQuery(context, { mergeParams: true })[identifier];
      case "body":
        if (context.request.hasBody) {
          const body = context.request.body();
          switch (body.type) {
            case "form":
              return this.parseFormBody(await body.value, identifier);
            case "form-data":
              return this.parseFormDataBody(
                await body.value.read(),
                identifier,
              );
            case "json":
              return this.parseJsonBody(await body.value, identifier);
            default:
              return await body.value;
          }
        }
        return;
      case "cookie":
        return context.cookies.get(identifier);
      case "header":
        return context.request.headers.get(identifier);
      case "state":
        return context.state[identifier];
      case "requestState": {
        const request = context.request as unknown as {
          __state: Record<string, unknown>;
        };
        let state = request.__state;
        if (!state) {
          return;
        }
        return state[identifier];
      }
      case "request":
        return context.request;
      case "response":
        return context.response;
      default:
        throw new Error(`Unsupported context data ${kind}`);
    }
  }

  setContextItem(
    kind: "body" | "status" | "cookie" | "header" | "state" | "requestState",
    context: RouterContext,
    // deno-lint-ignore no-explicit-any
    value: any,
    // deno-lint-ignore no-explicit-any
    identifier?: any,
    // deno-lint-ignore no-explicit-any
    options?: any,
  ) {
    switch (kind) {
      case "body":
        context.response.body = value;
        break;
      case "status":
        context.response.status = value;
        break;
      case "cookie":
        context.cookies.set(identifier, value, options);
        break;
      case "header":
        context.response.headers.set(identifier, value);
        break;
      case "state":
        context.state[identifier] = value;
        break;
      case "requestState": {
        const request = context.request as unknown as {
          __state: Record<string, unknown>;
        };
        let state = request.__state;
        if (!state) {
          state = {};
          request.__state = state;
        }
        state[identifier] = value;
      }
    }
  }

  async sendFile(context: RouterContext, path: string) {
    context.response.body = await Deno.readFile(path);
  }

  /**
   * Start listening for requests
   */
  async listen(options: ListenOptions) {
    await this.#app.listen(options);
  }

  private parseFormBody(form: URLSearchParams, identifier: string) {
    if (identifier) {
      return form.get(identifier);
    }
    return Array.from(form.entries()).reduce(
      (prev, [currKey, currValue]) => ({
        ...prev,
        [currKey]: prev[currKey]
          ? Array.isArray(prev[currKey])
            ? [...(prev[currKey] as []), currValue]
            : [prev[currKey], currValue]
          : currValue,
      }),
      {} as Record<string, unknown>,
    );
  }

  private parseFormDataBody(formData: FormDataBody, identifier: string) {
    if (identifier) {
      return formData.fields[identifier];
    }
    return formData.fields;
  }

  private parseJsonBody(json: Record<string, unknown>, identifier: string) {
    if (identifier) {
      return json[identifier];
    }
    return json;
  }
}
