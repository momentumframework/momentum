import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Header(name: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("header", context, name)
  );
}
