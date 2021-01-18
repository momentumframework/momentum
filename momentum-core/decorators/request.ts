import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Request() {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.extractFromContext("request", context)
  );
}
