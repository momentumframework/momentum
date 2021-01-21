import { ControllerClass } from "./controller-metadata.ts";
import { Type } from "./deps.ts";
import { ValueProvider } from "./value-provider.ts";

export class ValueProviderCatalog {
  private static readonly catalog = new Map<
    Type,
    {
      actions: {
        [action: string]: {
          valueProviders: ValueProvider[];
        };
      };
    }
  >();

  static registerValueProvider(
    type: ControllerClass,
    action: string,
    parameterIndex: number,
    valueProvider: ValueProvider
  ) {
    let controllerRegistration = this.catalog.get(type);
    if (!controllerRegistration) {
      controllerRegistration = { actions: {} };
      this.catalog.set(type, controllerRegistration);
    }
    let actionRegistration = controllerRegistration.actions[action];
    if (!actionRegistration) {
      actionRegistration = { valueProviders: [] };
      controllerRegistration.actions[action] = actionRegistration;
    }
    actionRegistration.valueProviders[parameterIndex] = valueProvider;
  }

  static getValueProvider(
    type: ControllerClass,
    action: string,
    parameterIndex: number
  ) {
    return this.catalog.get(type)?.actions[action].valueProviders[
      parameterIndex
    ];
  }
}
