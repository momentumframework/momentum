import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Param(name: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("parameter", context, name)
  );
}
