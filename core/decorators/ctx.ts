import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Decorator that gets the underlying platform context object as a action argument
 */
export function Ctx() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getContext(),
  );
}
