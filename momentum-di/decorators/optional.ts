import {
  DiContainer,
  Type,
} from "../di-container.ts";

export function Optional(): PropertyDecorator & ParameterDecorator {
  return function (
    target: Object,
    propName?: string | symbol,
    paramIndex?: number,
  ) {
    if (propName) {
      DiContainer.global().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { isOptional: true },
      );
    }
    if (paramIndex || paramIndex === 0) {
      DiContainer.global().registerCtorParam(
        target as Type,
        paramIndex,
        { isOptional: true },
      );
    }
  };
}
