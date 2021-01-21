import { ControllerClass } from "./controller-metadata.ts";
import { Type } from "./deps.ts";
import { MvFilter } from "./mv-filter.ts";

interface FilterRegistration {
  filter: MvFilter | Type<MvFilter>;
  priority?: number;
}

export class FilterCatalog {
  private static readonly globalCatalog: FilterRegistration[] = [];
  private static readonly controllerCatalog = new Map<
    Type,
    {
      registrations: FilterRegistration[];
      actions: {
        [action: string]: {
          registrations: FilterRegistration[];
        };
      };
    }
  >();

  static registerGlobalFilter(
    filter: Type<MvFilter> | MvFilter,
    priority?: number
  ) {
    this.globalCatalog.push({ filter, priority });
  }

  static registerControllerFilter(
    type: ControllerClass,
    filter: Type<MvFilter> | MvFilter,
    priority?: number
  ) {
    this.getControllerRegistration(type).registrations.push({
      filter,
      priority,
    });
  }

  static registerActionFilter(
    type: ControllerClass,
    action: string,
    filter: Type<MvFilter> | MvFilter,
    priority?: number
  ) {
    this.getActionRegistration(type, action).registrations.push({
      filter,
      priority,
    });
  }

  static getFilters(type: ControllerClass, action: string) {
    const mergedFilters = [
      ...this.globalCatalog,
      ...(this.controllerCatalog.get(type)?.registrations ?? []),
      ...(this.controllerCatalog.get(type)?.actions[action].registrations ??
        []),
    ];
    const sortedFilters = mergedFilters
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map((registration) => registration.filter);

    return sortedFilters;
  }

  private static getControllerRegistration(type: ControllerClass) {
    let registration = this.controllerCatalog.get(type);
    if (!registration) {
      registration = { actions: {}, registrations: [] };
      this.controllerCatalog.set(type, registration);
    }
    return registration;
  }

  private static getActionRegistration(type: ControllerClass, action: string) {
    let controllerRegistration = this.getControllerRegistration(type);
    let actionRegistration = controllerRegistration.actions[action];
    if (!actionRegistration) {
      actionRegistration = { registrations: [] };
      controllerRegistration.actions[action] = actionRegistration;
    }
    return actionRegistration;
  }
}
