import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Decorator that extracts an action argument from a route parameter
 * 
 * @param name Name of the parameter
 */
export function Param(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getParameter(name),
    name,
  );
}
