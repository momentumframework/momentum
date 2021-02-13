import {
  ClassProvider,
  ConstructorProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from "./module-metadata.ts";

export function isProvider(arg: unknown): arg is Provider {
  return Object.prototype.hasOwnProperty.call(arg, "provide");
}
export function isValueProvider(arg: Provider): arg is ValueProvider {
  return Object.prototype.hasOwnProperty.call(arg, "useValue");
}
export function isFactoryProvider(arg: Provider): arg is FactoryProvider {
  return Object.prototype.hasOwnProperty.call(arg, "useFactory");
}
export function isClassProvider(arg: Provider): arg is ClassProvider {
  return Object.prototype.hasOwnProperty.call(arg, "useClass");
}
export function isConstructorProvider(
  arg: Provider,
): arg is ConstructorProvider {
  return (
    isProvider(arg) &&
    typeof arg.provide === "function" &&
    !isClassProvider(arg) &&
    !isFactoryProvider(arg) &&
    !isValueProvider(arg)
  );
}
