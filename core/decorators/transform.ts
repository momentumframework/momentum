import { Type } from "../deps.ts";
import { MvTransformer } from "../mv-transformer.ts";
import { TransformerCatalog } from "../transformer-catalog.ts";

/**
 * Decorator that applies a transformer at a controller, action, or parameter level
 * 
 * @param transformer Transformer type or instance
 * @param priority Execution priority of the transformer
 * 
 * @remarks
 * Multiple transformers can be executed for a single parameter.
 * Priority parameter determines the order in which they will execute.
 * 
 * The transformer can either be an instance of @see MvTransformer 
 * or a type that implements @see MvTransformer which will be resolved
 * by the request scoped resolver. 
 */
export function Transform(
  transformer:
    | MvTransformer
    | Type<MvTransformer>,
  priority?: number,
): ClassDecorator & MethodDecorator & ParameterDecorator {
  return <T>(
    // deno-lint-ignore ban-types
    target: Function | Object,
    propertyKey?: string | symbol,
    parameterIndex?: number | TypedPropertyDescriptor<T>,
  ) => {
    if (!propertyKey) {
      TransformerCatalog.registerTransformer(
        transformer,
        target as Type,
        undefined,
        undefined,
        priority,
      );
    } else {
      TransformerCatalog.registerTransformer(
        transformer,
        target.constructor as Type,
        propertyKey.toString(),
        typeof parameterIndex === "number" ? parameterIndex : undefined,
        priority,
      );
    }
  };
}
