import { Type } from "../deps.ts";
import { FilterCatalog } from "../filter-catalog.ts";
import { MvFilter } from "../mv-filter.ts";

/**
 * Apply a filter to a controller or action
 * 
 * The filter can either be an instance of @see MvFilter 
 * or a type that implements @see MvFilter which will be resolved
 * by the platform resolver. 
 */
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
