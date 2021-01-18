import { Application, Router, RouterContext } from "./deps.ts";
import { ModuleClass, Platform } from "../momentum-core/mod.ts";
import { DependencyScope, DiContainer } from "../momentum-di/mod.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "../momentum-core/controller-metadata.ts";

export function platformOak(
  module: ModuleClass,
  app: Application = new Application(),
  router: Router = new Router()
) {
  const platform = new OakPlatform(
    DiContainer.root(),
    DependencyScope.beginScope(),
    app,
    router
  );
  platform.bootstrapModule(module);
  return platform;
}

export class OakPlatform extends Platform {
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

  async preInit() {}

  // deno-lint-ignore require-await
  async postInit() {
    this.#app.use(this.#router.routes());
  }

  // deno-lint-ignore require-await
  async addRouteHandler(
    _controller: ControllerClass,
    _action: string,
    route: string,
    _controllerMetadata: ControllerMetadata,
    actionMetadata: ActionMetadata,
    // deno-lint-ignore no-explicit-any
    handler: (context: RouterContext) => any
  ) {
    switch (actionMetadata.method) {
      case "get":
        this.#router.get(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
      case "post":
        this.#router.post(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
      case "put":
        this.#router.put(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
      case "delete":
        this.#router.delete(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
      case "head":
        this.#router.head(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
      case "patch":
        this.#router.patch(route, async (context) => {
          context.response.body = await handler(context);
        });
        break;
    }
  }

  async extractFromContext(
    kind:
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
      case "parameter":
        return context.params[identifier];
      case "body":
        if (context.request.hasBody) {
          const body = await context.request.body().value;
          if (identifier) {
            return await body[identifier];
          } else {
            return body;
          }
        }
        return;
      default:
        throw new Error(`Unsupported context data ${kind}`);
    }
  }

  async listen(port: number) {
    return await this.#app.listen({ port });
  }
}
