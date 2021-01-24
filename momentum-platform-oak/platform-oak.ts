import {
  Application,
  FormDataBody,
  helpers as oakHelpers,
  ListenOptions,
  Router,
  RouterContext,
} from "./deps.ts";
import { ServerPlatform } from "../momentum-core/mod.ts";
import { DependencyScope, DiContainer } from "../momentum-di/mod.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "../momentum-core/controller-metadata.ts";

export function platformOak(
  app: Application = new Application(),
  router: Router = new Router()
) {
  return new OakPlatform(
    DiContainer.root(),
    DependencyScope.beginScope(),
    app,
    router
  );
}

export class OakPlatform extends ServerPlatform<ListenOptions> {
  #app: Application;
  #router: Router;
  constructor(
    container: DiContainer,
    scope: DependencyScope,
    application: Application,
    router: Router
  ) {
    super(container, scope);
    this.#app = application;
    this.#router = router;
  }

  async postBootstrap() {
    this.#app.use(this.#router.routes());
    await super.postBootstrap();
  }

  addRouteHandler(
    _controller: ControllerClass,
    _action: string,
    route: string,
    _controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    // deno-lint-ignore no-explicit-any
    handler: (context: RouterContext) => any
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

  async extractFromContext(
    kind:
      | "url"
      | "parameter"
      | "query"
      | "body"
      | "cookie"
      | "header"
      | "request"
      | "response",
    context: RouterContext,
    identifier: string
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
                identifier
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
      case "request":
        return context.request;
      case "response":
        return context.response;
      default:
        throw new Error(`Unsupported context data ${kind}`);
    }
  }

  async listen(options: ListenOptions) {
    return await this.#app.listen(options);
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
      {} as Record<string, unknown>
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
