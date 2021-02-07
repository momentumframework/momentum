import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Cookie(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getCookie(name),
  );
}
