import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Res() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getResponse()
  );
}
