import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Extract an action argument from a route parameter
 * 
 * @param name Name of the parameter
 */
export function Param(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getParameter(name),
  );
}
