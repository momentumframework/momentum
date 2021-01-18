import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Ctx() {
  return createParameterDecorator(async (context) => context);
}
