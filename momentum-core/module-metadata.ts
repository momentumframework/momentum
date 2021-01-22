import { FactoryFunction, Type, TypeIdentifier } from "../momentum-di/mod.ts";

type ConstructorProvider = { provide: Type; deps?: TypeIdentifier[] };
type ClassProvider = {
  provide: TypeIdentifier;
  useClass: Type;
  deps?: TypeIdentifier[];
};
type ValueProvider = { provide: TypeIdentifier; useValue: unknown };
type FactoryProvider = {
  provide: TypeIdentifier;
  useFactory: FactoryFunction;
  deps?: TypeIdentifier[];
};
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
  return !!(arg as Provider).provide;
}
export function isValueProvider(arg: Provider): arg is ValueProvider {
  return !!(arg as ValueProvider).useValue;
}
export function isFactoryProvider(arg: Provider): arg is FactoryProvider {
  return !!(arg as FactoryProvider).useFactory;
}
export function isClassProvider(arg: Provider): arg is ClassProvider {
  return !!(arg as ClassProvider).useClass;
}
export function isConstructorProvider(
  arg: Provider
): arg is ConstructorProvider {
  return (
    isProvider(arg) &&
    !isClassProvider(arg) &&
    !isFactoryProvider(arg) &&
    !isValueProvider(arg)
  );
}
