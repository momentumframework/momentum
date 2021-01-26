import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Header(name: string) {
  return createParameterDecorator(
    async (contextAccessor) => await contextAccessor.getHeader(name)
  );
}
