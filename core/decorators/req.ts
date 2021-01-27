import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Req() {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getRequest()
  );
}
