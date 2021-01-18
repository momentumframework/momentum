import { Platform } from "../../deps.ts";
import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass } from "../controller-metadata.ts";

export function createParameterDecorator(
  callback: (context: unknown, platform: Platform) => Promise<unknown>,
  valueProvider = true
): ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    ControllerCatalog.registerParameterMetadata(
      target.constructor as ControllerClass,
      propertyKey.toString(),
      {
        index: parameterIndex,
        name: propertyKey.toString(),
        isValueProvider: valueProvider,
        callback,
      }
    );
  };
}
