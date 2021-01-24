import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Req() {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.getContextItem("request", context)
  );
}
