import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";

export function Inject<T = unknown>(
  identifier: TypeIdentifier<T>,
  options?: { defer: boolean }
): PropertyDecorator & ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propName?: string | symbol,
    paramIndex?: number
  ) {
    if (propName) {
      DiContainer.root().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { identifier, defer: options?.defer }
      );
    }
    if (paramIndex || paramIndex === 0) {
      DiContainer.root().registerCtorParam(target as Type, paramIndex, {
        identifier,
        defer: options?.defer,
      });
    }
  };
}
