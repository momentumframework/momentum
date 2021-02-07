import { Type } from "../deps.ts";
import { FilterCatalog } from "../filter-catalog.ts";
import { MvFilter } from "../mv-filter.ts";

export function Filter(
  filter: MvFilter | Type<MvFilter>,
): ClassDecorator & MethodDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (propertyKey) {
      FilterCatalog.registerActionFilter(
        target.constructor as Type,
        propertyKey.toString(),
        filter,
      );
    } else {
      FilterCatalog.registerControllerFilter(target as Type, filter);
    }
  };
}
