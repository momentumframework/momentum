import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Get the underlying platforms context object as a action argument
 */
export function Ctx() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getContext(),
  );
}
