import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Decorator that gets the underlying platform response object as a action argument
 */
export function Res() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getResponse(),
    "res",
  );
}
