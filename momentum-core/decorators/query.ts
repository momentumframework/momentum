import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Query(name: string) {
  return createParameterDecorator(
    async (context, platform) =>
      await platform.getContextItem("query", context, name)
  );
}
