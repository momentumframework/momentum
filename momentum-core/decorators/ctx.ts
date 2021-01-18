import { createParameterDecorator } from "./create-parameter-decorator.ts";

export function Ctx() {
  return createParameterDecorator((context) => context);
}
