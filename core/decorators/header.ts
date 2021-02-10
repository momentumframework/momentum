import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Extract an action argument from a header on the request
 * 
 * @param name Name of the header
 */
export function Header(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getHeader(name),
  );
}
