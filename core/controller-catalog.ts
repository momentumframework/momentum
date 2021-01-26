import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { trimSlashes, Type } from "./deps.ts";

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

  static *getMetadataByRoute(type: ControllerClass) {
    const registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      return;
    }
    for (const [method, actionRegistration] of Object.entries(
      registration.actions
    )) {
      yield {
        action: method,
        route: ControllerCatalog.constructRoute(
          registration.metadata,
          actionRegistration.metadata
        ),
        controllerMetadata: registration.metadata,
        actionMetadata: actionRegistration.metadata,
        parameterMetadata: actionRegistration.parameters,
      };
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
    const controllerRoute = trimSlashes(controllerMetadata?.route);
    if (controllerRoute) {
      parts.push(controllerRoute);
    }
    const actionRoute = trimSlashes(actionMetadata?.route);
    if (actionRoute) {
      parts.push(actionRoute);
    }
    return "/" + parts.join("/");
  }
}
