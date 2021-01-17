import { Type } from "../momentum-di/mod.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
} from "./controller-metadata.ts";

export class ControllerCatalog {
  private static readonly catalog = new Map<
    Type,
    {
      metadata?: ControllerMetadata;
      actions: { [name: string]: ActionMetadata };
    }
  >();

  static registerControllerMetadata(
    type: ControllerClass,
    metadata: ControllerMetadata
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { metadata, actions: {} };
    } else {
      registration.metadata = metadata;
    }
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerActionMetadata(
    type: ControllerClass,
    method: string,
    metadata: ActionMetadata
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: { [method]: metadata } };
    } else {
      registration.actions[method] = metadata;
    }
    ControllerCatalog.catalog.set(type, registration);
  }

  static *getMetadataByRoute() {
    for (const [
      type,
      { metadata, actions },
    ] of ControllerCatalog.catalog.entries()) {
      for (const [method, actionMetadata] of Object.entries(actions)) {
        yield {
          controller: type,
          action: method,
          route: ControllerCatalog.constructRoute(metadata, actionMetadata),
          controllerMetadata: metadata,
          actionMetadata,
        };
      }
    }
  }

  private static constructRoute(
    controllerMetadata: ControllerMetadata | undefined,
    actionMetadata: ActionMetadata
  ) {
    const parts = [];
    const controllerRoute = this.trimSlashes(controllerMetadata?.route);
    if (controllerRoute) {
      parts.push(controllerRoute);
    }
    const actionRoute = this.trimSlashes(actionMetadata?.route);
    if (actionRoute) {
      parts.push(actionRoute);
    }
    return "/" + parts.join("/");
  }

  private static trimSlashes(path?: string) {
    return path?.replace(/^[\/]+|[\/]+$/g, "");
  }
}
