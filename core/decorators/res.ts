import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Get the underlying platforms response object as a action argument
 */
export function Res() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getResponse(),
  );
}
