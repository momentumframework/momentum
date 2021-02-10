import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Get the underlying platforms request object as a action argument
 */
export function Req() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getRequest(),
  );
}
