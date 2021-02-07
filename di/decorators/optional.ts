import { DiContainer, Type } from "../di-container.ts";

export function Optional(): PropertyDecorator & ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propName?: string | symbol,
    paramIndex?: number,
  ) {
    if (propName) {
      DiContainer.root().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { isOptional: true },
      );
    }
    if (paramIndex || paramIndex === 0) {
      DiContainer.root().registerCtorParam(target as Type, paramIndex, {
        isOptional: true,
      });
    }
  };
}
