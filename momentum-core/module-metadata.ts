import {
  FactoryFunction,
  Type,
  TypeIdentifier,
} from "../momentum-di/mod.ts";

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
  imports?: ModuleClass[];
  providers?: (Type | Provider)[];
  exports?: (TypeIdentifier | ModuleClass)[];
}

export interface ExtendedModuleMetadata extends ModuleMetadata {
  type: ModuleClass;
  params: TypeIdentifier[];
  props: Record<string, TypeIdentifier>;
}

export function isProvider(arg: unknown): arg is Provider {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return !!arg.provide;
}
export function isValueProvider(arg: Provider): arg is ValueProvider {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return !!arg.useValue;
}
export function isFactoryProvider(arg: Provider): arg is FactoryProvider {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return !!arg.useFactory;
}
export function isClassProvider(arg: Provider): arg is ClassProvider {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return !!arg.useFactory;
}
export function isConstructorProvider(
  arg: Provider,
): arg is ConstructorProvider {
  return isProvider(arg) &&
    !isClassProvider(arg) &&
    !isFactoryProvider(arg) &&
    !isValueProvider(arg);
}
