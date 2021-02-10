import { createParameterDecorator } from "./create-parameter-decorator.ts";

/**
 * Extract an action argument as the full body of a request
 */
// deno-lint-ignore no-explicit-any
export function Body(): any;
/**
 * Extract an action argument from a field of the body of a request
 * 
 * @param name Name of the field
 */
// deno-lint-ignore no-explicit-any
export function Body(name: string): any;
export function Body(name?: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getBody(name),
  );
}
