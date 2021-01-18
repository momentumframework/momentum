import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Cookie(name: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("cookie", context, name)
  );
}
