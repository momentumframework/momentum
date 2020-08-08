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
      DiContainer.root().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { identifier },
      );
    }
    if (paramIndex || paramIndex === 0) {
      DiContainer.root().registerCtorParam(
        target as Type,
        paramIndex,
        { identifier },
      );
    }
  };
}
