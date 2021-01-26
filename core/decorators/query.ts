import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Query(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getQuery(name)
  );
}
