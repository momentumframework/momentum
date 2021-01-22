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
          parameters?: ParameterMetadata[];
        };
      };
    }
  >();

  static registerControllerMetadata(
    type: ControllerClass,
    metadata: Omit<ControllerMetadata, "type">
  ) {
    this.getControllerRegistration(type).metadata = {
      ...metadata,
      type,
    };
  }

  static registerActionMetadata(
    type: ControllerClass,
    action: string,
    metadata: Omit<ActionMetadata, "action">
  ) {
    this.getActionRegistration(type, action).metadata = {
      ...metadata,
      action,
    };
  }

  static registerParameterMetadata(
    type: ControllerClass,
    action: string,
    metadata: ParameterMetadata
  ) {
    this.getActionRegistration(type, action).parameters?.push(metadata);
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

  static getParameterMetadata(type: ControllerClass, action: string) {
    return this.getActionRegistration(type, action).parameters;
  }

  private static getControllerRegistration(type: ControllerClass) {
    let registration = this.catalog.get(type);
    if (!registration) {
      registration = { actions: {} };
      this.catalog.set(type, registration);
    }
    return registration;
  }

  private static getActionRegistration(type: ControllerClass, action: string) {
    const controllerRegistration = this.getControllerRegistration(type);
    let actionRegistration = controllerRegistration.actions[action];
    if (!actionRegistration) {
      actionRegistration = { parameters: [] };
      controllerRegistration.actions[action] = actionRegistration;
    }
    return actionRegistration;
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
