import { Type } from "../momentum-di/mod.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";

export class ControllerCatalog {
  private static readonly catalog = new Map<
    Type,
    {
      metadata?: ControllerMetadata;
      actions: {
        [action: string]: {
          metadata?: ActionMetadata;
          parameters: ParameterMetadata[];
        };
      };
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
    action: string,
    metadata: ActionMetadata
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: { [action]: { metadata, parameters: [] } } };
    } else {
      registration.actions[action].metadata = metadata;
    }
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerParameterMetadata(
    type: ControllerClass,
    action: string,
    metadata: ParameterMetadata
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: { [action]: { parameters: [metadata] } } };
    } else {
      registration.actions[action].parameters.push(metadata);
    }
    ControllerCatalog.catalog.set(type, registration);
  }

  static *getMetadataByRoute() {
    for (const [
      type,
      { metadata, actions },
    ] of ControllerCatalog.catalog.entries()) {
      for (const [method, actionRegistration] of Object.entries(actions)) {
        yield {
          controller: type,
          action: method,
          route: ControllerCatalog.constructRoute(
            metadata,
            actionRegistration.metadata
          ),
          controllerMetadata: metadata,
          actionMetadata: actionRegistration.metadata,
          parameterMetadata: actionRegistration.parameters,
        };
      }
    }
  }

  static getParameterMetadat(controller: ControllerClass, action: string) {
    return this.catalog.get(controller)?.actions[action].parameters;
  }

  private static constructRoute(
    controllerMetadata: ControllerMetadata | undefined,
    actionMetadata: ActionMetadata | undefined
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
