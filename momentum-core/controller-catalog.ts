import { Type } from "../momentum-di/mod.ts";
import {
  ExtendedActionMetadata,
  ExtendedControllerMetadata,
  ExtendedParameterMetadata,
  ValueProvider,
} from "./controller-metadata-internal.ts";
import {
  ActionMetadata,
  ControllerClass,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { MvFilter } from "./mv-filter.ts";

export class ControllerCatalog {
  private static readonly catalog = new Map<
    Type,
    {
      metadata?: ExtendedControllerMetadata;
      actions: {
        [action: string]: {
          metadata?: ExtendedActionMetadata;
          parameters?: ExtendedParameterMetadata[];
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
      registration.metadata = {
        ...metadata,
        filters: registration.metadata?.filters,
      };
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
      registration = { actions: {} };
    }
    registration.actions[action].metadata = {
      ...registration.actions[action].metadata,
      ...metadata,
    };
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerParameterMetadata(
    type: ControllerClass,
    action: string,
    metadata: ParameterMetadata
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: {} };
    }
    if (!registration.actions[action]) {
      registration.actions[action] = { parameters: [] };
    }
    const parameters = registration.actions[action]
      .parameters as ExtendedParameterMetadata[];
    parameters[metadata.index] = { ...parameters[metadata.index], ...metadata };
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerValueProvider(
    type: ControllerClass,
    action: string,
    parameterIndex: number,
    valueProvider: ValueProvider
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: {} };
    }
    if (!registration.actions[action]) {
      registration.actions[action] = {};
    }
    if (!registration.actions[action].parameters) {
      registration.actions[action].parameters = [];
    }
    const parameters = registration.actions[action]
      .parameters as ExtendedParameterMetadata[];
    if (!parameters[parameterIndex]) {
      parameters[parameterIndex] = { index: parameterIndex };
    }
    parameters[parameterIndex].valueProvider = valueProvider;
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerControllerFilter(
    type: ControllerClass,
    filter: Type<MvFilter> | MvFilter
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: {} };
    }
    if (!registration.metadata) {
      registration.metadata = { type };
    }
    if (!registration.metadata.filters) {
      registration.metadata.filters = [];
    }
    registration.metadata.filters.push(filter);
    ControllerCatalog.catalog.set(type, registration);
  }

  static registerActionFilter(
    type: ControllerClass,
    action: string,
    filter: Type<MvFilter> | MvFilter
  ) {
    let registration = ControllerCatalog.catalog.get(type);
    if (!registration) {
      registration = { actions: {} };
    }
    if (!registration.actions[action]) {
      registration.actions[action] = {};
    }
    if (!registration.actions[action].metadata) {
      registration.actions[action].metadata = { action, filters: [] };
    }
    const metadata = registration.actions[action]
      .metadata as ExtendedActionMetadata;
    if (!metadata.filters) {
      metadata.filters = [];
    }
    metadata.filters?.push(filter);
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

  static getParameterMetadata(controller: ControllerClass, action: string) {
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
