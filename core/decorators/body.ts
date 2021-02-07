import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Body(name?: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getBody(name),
  );
}
