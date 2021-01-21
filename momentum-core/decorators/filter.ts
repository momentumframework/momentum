import { ControllerCatalog } from "../controller-catalog.ts";
import { Type } from "../deps.ts";
import { MvFilter } from "../mv-filter.ts";

export function Filter(
  filter: MvFilter | Type<MvFilter>
): ClassDecorator & MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (propertyKey) {
      ControllerCatalog.registerActionFilter(
        target.constructor as Type,
        propertyKey.toString(),
        filter
      );
    } else {
      ControllerCatalog.registerControllerFilter(target as Type, filter);
    }
  };
}
