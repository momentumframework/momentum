import { Reflect } from "../shims/reflect.ts";
import { DiContainer, Type } from "../di-container.ts";

export function Injectable() {
  return function (target: Type<unknown>) {
    const paramTypes: Type[] = Reflect.getMetadata("design:paramtypes", target);
    DiContainer.global().register(
      target,
      {
        kind: "type",
        type: target,
        params: paramTypes?.map((param) => ({ identifier: param })),
      },
    );
  };
}
