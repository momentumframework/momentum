import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Decorator that gets the underlying platform request object as a action argument
 */
export function Req() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getRequest(),
  );
}
