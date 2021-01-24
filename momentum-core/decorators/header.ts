import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Header(name: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.getContextItem("header", context, name)
  );
}
