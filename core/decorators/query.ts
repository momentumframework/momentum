import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Extract an action argument from a query parameter of the request
 * 
 * @param name Name of the query parameter
 */
export function Query(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getQuery(name),
  );
}
