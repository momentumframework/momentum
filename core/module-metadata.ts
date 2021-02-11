import { FactoryFunction, Scope, Type, TypeIdentifier } from "./deps.ts";

type ScopedProvider =
  | {
    /**
     * The scope of the provider
     */
    scope?:
      | Scope.Injection
      | Scope.Request
      | Scope.Singleton
      | Scope.Transient;
  }
  | {
    /**
     * The scope of the provider
     */
    scope: Scope.Custom;
    /**
     * The identifier of the custom scope
     */
    scopeIdentifier?: unknown;
  };
export type ConstructorProvider = {
  /**
   * The type of symbol to provide
   */
  provide: Type;
  /**
   * The dependencies to inject
   */
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type ClassProvider<T = unknown> = {
  /**
   * The type of symbol to provide
   */
  provide: TypeIdentifier;
  /**
   * The class to inject
   */
  useClass: Type<T>;
  /**
   * The dependencies to inject
   */
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type ValueProvider<T = unknown> = {
  /**
   * The type of symbol to provide
   */
  provide: TypeIdentifier;
  /**
   * The value to inject
   */
  useValue: T;
} & ScopedProvider;
export type FactoryProvider<T = unknown> = {
  /**
   * The type of symbol to provide
   */
  provide: TypeIdentifier;
  /**
   * The factory which creates the object to inject
   */
  useFactory: FactoryFunction<T>;
  /**
   * The dependencies to inject
   */
  deps?: TypeIdentifier[];
} & ScopedProvider;
export type Provider =
  | ConstructorProvider
  | ClassProvider
  | ValueProvider
  | FactoryProvider;

export type ModuleClass = Type;

export interface ModuleMetadata {
  /**
   * The modules to import
   */
  imports?: (ModuleClass | DynamicModule)[];
  /**
   * The providers to make available to the module
   */
  providers?: (Type | Provider)[];
  /**
   * The controllers to make available to the module
   */
  controllers?: Type[];
  /**
   * Tye providers to export from the module
   */
  exports?: (TypeIdentifier | ModuleClass)[];
}

export interface ExtendedModuleMetadata extends ModuleMetadata {
  type: ModuleClass;
  params: TypeIdentifier[];
  props: Record<string, TypeIdentifier>;
}

export type DynamicModule = Omit<ExtendedModuleMetadata, "params" | "props">;
