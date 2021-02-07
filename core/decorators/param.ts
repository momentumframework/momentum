import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Param(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getParameter(name),
  );
}
