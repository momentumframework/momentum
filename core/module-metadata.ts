import { FactoryFunction, Scope, Type, TypeIdentifier } from "./deps.ts";

type ScopedProvider =
  | {
    scope?:
      | Scope.Injection
      | Scope.Request
      | Scope.Singleton
      | Scope.Transient;
  }
  | {
    scope: Scope.Custom;
    scopeIdentifier?: unknown;
  };
type ConstructorProvider = {
  provide: Type;
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type ClassProvider<T = unknown> = {
  provide: TypeIdentifier;
  useClass: Type<T>;
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type ValueProvider<T = unknown> = {
  provide: TypeIdentifier;
  useValue: T;
} & ScopedProvider;
export type FactoryProvider<T = unknown> = {
  provide: TypeIdentifier;
  useFactory: FactoryFunction<T>;
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type Provider =
  | ConstructorProvider
  | ClassProvider
  | ValueProvider
  | FactoryProvider;

export type ModuleClass = Type;

export interface ModuleMetadata {
  imports?: (ModuleClass | DynamicModule)[];
  providers?: (Type | Provider)[];
  controllers?: Type[];
  exports?: (TypeIdentifier | ModuleClass)[];
}

export interface ExtendedModuleMetadata extends ModuleMetadata {
  type: ModuleClass;
  params: TypeIdentifier[];
  props: Record<string, TypeIdentifier>;
}

export type DynamicModule = Omit<ExtendedModuleMetadata, "params" | "props">;

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
