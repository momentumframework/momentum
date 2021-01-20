import { ControllerCatalog } from "../controller-catalog.ts";
import { ValueProvider } from "../controller-metadata-internal.ts";
import { ControllerClass } from "../controller-metadata.ts";
import { Reflect, Type } from "../deps.ts";

export function createParameterDecorator(
  valueProvider?: ValueProvider
): ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    const parameterType = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey
    )?.[parameterIndex] as Type;
    ControllerCatalog.registerParameterMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      {
        index: parameterIndex,
        name: propertyKey.toString(),
        type: parameterType,
      }
    );
    if (valueProvider) {
      ControllerCatalog.registerValueProvider(
        target.constructor as ControllerClass,
        propertyKey.toString(),
        parameterIndex,
        valueProvider
      );
    }
  };
}
