import {
  DiContainer,
  Type,
  TypeIdentifier,
} from "../di-container.ts";

export function Inject<T = unknown>(
  identifier: TypeIdentifier<T>,
): PropertyDecorator & ParameterDecorator {
  return function (
    target: Object,
    propName?: string | symbol,
    paramIndex?: number,
  ) {
    if (propName) {
      DiContainer.global().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { identifier },
      );
    }
    if (paramIndex || paramIndex === 0) {
      DiContainer.global().registerCtorParam(
        target as Type,
        paramIndex,
        { identifier },
      );
    }
  };
}
