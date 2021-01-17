import { ControllerCatalog } from "../controller-catalog.ts";
import { ControllerClass } from "../controller-metadata.ts";

export function Param(name: string): ParameterDecorator {
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
        name: name ?? propertyKey.toString(),
        callback: async (context, platform) =>
          await platform.extractFromContext("parameter", name, context),
      }
    );
  };
}
