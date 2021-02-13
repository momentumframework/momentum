import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";

/**
 * Decorator used to inject a type using a type identifier
 */
export function Inject<T = unknown>(
  identifier: TypeIdentifier<T>,
  options?: {
    /**
     * When a dependency is marked as deferred, Deferred will be injected instead of the type.
     * The type can be resolved later by calling the value property
     */
    defer: boolean;
  },
): PropertyDecorator & ParameterDecorator;
export function Inject<T = unknown>(
  identifier: TypeIdentifier<T>,
  options?: { defer: boolean },
): PropertyDecorator & ParameterDecorator {
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
        { identifier, defer: options?.defer },
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
