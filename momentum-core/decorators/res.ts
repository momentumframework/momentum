import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Res() {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("response", context)
  );
}