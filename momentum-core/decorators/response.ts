import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Response() {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("response", context)
  );
}
