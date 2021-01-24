import { ControllerClass, Type } from "./deps.ts";

export interface ViewConfig {
  name?: string;
  path?: string;
  template?: string;
}

export class ViewCatalog {
  private static readonly viewCatalog = new Map<
    Type,
    {
      controller?: ViewConfig;
      actions: {
        [action: string]: ViewConfig;
      };
    }
  >();

  static registerControllerView(
    type: ControllerClass,
    registration: ViewConfig
  ) {
    this.getControllerRegistration(type).controller = {
      ...this.getControllerRegistration(type).controller,
      ...registration,
    };
  }

  static registerActionView(
    type: ControllerClass,
    action: string,
    registration: ViewConfig
  ) {
    this.getControllerRegistration(type).actions[action] = {
      ...this.getControllerRegistration(type).actions[action],
      ...registration,
    };
  }

  static getView(type: ControllerClass, action: string) {
    return {
      ...this.viewCatalog.get(type)?.controller,
      ...this.viewCatalog.get(type)?.actions[action],
    };
  }

  private static getControllerRegistration(type: ControllerClass) {
    let registration = this.viewCatalog.get(type);
    if (!registration) {
      registration = { actions: {} };
      this.viewCatalog.set(type, registration);
    }
    return registration;
  }
}
