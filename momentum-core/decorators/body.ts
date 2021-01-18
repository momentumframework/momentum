import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Body(name?: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("body", context, name)
  );
}
