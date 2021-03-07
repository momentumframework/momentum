import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass } from "../controller-metadata.ts";
import { Reflect, Type } from "../deps.ts";
import { ValueProviderCatalog } from "../value-provider-catalog.ts";
import { ValueProvider } from "../value-provider.ts";

/**
 * Creates a parameter decorator
 * 
 * @param valueProvider Optionally set a @see ValueProvider to extract a value from the context.
 */
export function createParameterDecorator(
  valueProvider?: ValueProvider,
  name?: string,
): ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const parameterType = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey,
    )?.[parameterIndex] as Type;
    ControllerCatalog.registerParameterMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      {
        index: parameterIndex,
        name,
        type: parameterType,
      },
    );
    if (valueProvider) {
      ValueProviderCatalog.registerValueProvider(
        target.constructor as ControllerClass,
        propertyKey.toString(),
        parameterIndex,
        valueProvider,
      );
    }
  };
}
