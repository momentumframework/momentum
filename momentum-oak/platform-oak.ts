import { Application, Context, Router } from "./deps.ts";
import { boostrapPlatform, Platform } from "../momentum-core/mod.ts";
import { DependencyScope, DiContainer } from "../momentum-di/mod.ts";
import { ControllerCatalog } from "../momentum-core/controller-catalog.ts";

export function platformOak(
  app: Application = new Application(),
  router: Router = new Router()
) {
  return boostrapPlatform(
    new OakPlatform(
      DiContainer.root(),
      DependencyScope.beginScope(),
      app,
      router
    )
  );
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
  initialize() {
    for (const {
      controller,
      action,
      route,
      controllerMetadata,
      actionMetadata,
    } of ControllerCatalog.getMetadataByRoute()) {
      console.log(
        controller,
        action,
        route,
        controllerMetadata,
        actionMetadata
      );
      const handler = async (context: Context) => {
        // deno-lint-ignore no-explicit-any
        const instance = this.resolve(controller) as any;
        const result = await instance[action](
          context.request,
          context.response
        );
        context.response.body = result;
      };
      switch (actionMetadata.method) {
        case "get":
          this.#router.get(route, handler);
          break;
        case "post":
          this.#router.post(route, handler);
          break;
        case "put":
          this.#router.put(route, handler);
          break;
        case "delete":
          this.#router.delete(route, handler);
          break;
        case "head":
          this.#router.head(route, handler);
          break;
        case "patch":
          this.#router.patch(route, handler);
          break;
      }
    }
    this.#app.use(this.#router.routes());
  }
}
