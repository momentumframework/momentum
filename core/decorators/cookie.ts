import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Decorator that extracts an action argument from a cookie on the request
 * 
 * @param name Name of the cookie
 */
export function Cookie(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getCookie(name),
    name,
  );
}
