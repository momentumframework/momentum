import {
  DependencyResolver,
  DiCache,
  DiContainer,
  Reflect,
  Scope,
  Type,
  TypeIdentifier,
} from "./deps.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import {
  DynamicModule,
  ExtendedModuleMetadata,
  ModuleClass,
} from "./module-metadata.ts";
import {
  isClassProvider,
  isConstructorProvider,
  isFactoryProvider,
  isProvider,
  isValueProvider,
} from "./type-guards.ts";

function isDynamicModule(
  module: ModuleClass | DynamicModule,
): module is DynamicModule {
  return typeof module !== "function";
}

/**
 * Represents a reference to an bootstrapped Momentum module
 */
export class ModuleRef {
  readonly #metadata: ExtendedModuleMetadata;
  readonly #diContainer: DiContainer;
  readonly #diCache: DiCache;
  readonly #instance: unknown;
  readonly #modules: ModuleRef[];

  constructor(
    metadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    diCache: DiCache,
    instance: unknown,
    modules: ModuleRef[],
  ) {
    this.#metadata = metadata;
    this.#diContainer = diContainer;
    this.#diCache = diCache;
    this.#instance = instance;
    this.#modules = modules;
  }

  /**
   * Get the module metadata
   */
  get metadata() {
    return Object.freeze({ ...this.#metadata });
  }

  /**
   * Get the module dependency injection container
   */
  get diContainer() {
    return this.#diContainer;
  }

  /**
   * Get the module instance
   */
  get instance() {
    return this.#instance;
  }

  /**
   * Get the sub-modules of the module
   */
  get modules() {
    return [...this.#modules];
  }

  /**
   * Get the controllers associated with the module
   */
  get controllers(): Type<unknown>[] {
    return [
      ...(this.#metadata.controllers ?? []),
      ...this.#modules.flatMap((module) => module.controllers ?? []),
    ];
  }

  /**
   * Resolves an instance of @see TReturn
   * 
   * @param identifier type identifer to create an instance of
   * 
   * @typeParam TReturn - return type
   * 
   * @returns {TReturn}
   */
  resolve<TReturn = unknown>(identifier: TypeIdentifier): Promise<TReturn>;
  /**
   * Resolves an instance of @see TReturn using a custom @see DiCache
   * 
   * @param identifier Type identifer to create an instance of
   * @param cache The @see DiCache to use for resolution
   * 
   * @typeParam TReturn - return type
   * 
   * @returns {TReturn}
   */
  resolve<TReturn = unknown>(
    identifier: TypeIdentifier,
    cache: DiCache,
  ): Promise<TReturn>;
  async resolve<T = unknown>(
    identifier: TypeIdentifier,
    cache = this.#diCache,
  ) {
    const scopedCache = cache.createChild().beginScope(Scope.Injection);
    try {
      const resolver = new DependencyResolver(this.#diContainer, scopedCache);
      return await resolver.resolve<T>(identifier);
    } finally {
      scopedCache.endScope(Scope.Injection);
    }
  }

  public static async createModuleRef(
    moduleMetadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    diCache: DiCache,
    moduleCache: Map<ExtendedModuleMetadata, ModuleRef> = new Map(),
  ): Promise<ModuleRef> {
    let moduleRef = moduleCache.get(moduleMetadata);
    if (!moduleRef) {
      const moduleDiContainer = diContainer.createSibling(
        moduleMetadata.type.name,
      );
      const subModules: ModuleRef[] = [];
      if (moduleMetadata.imports) {
        for (const submoduleDefinition of moduleMetadata.imports) {
          subModules.push(
            await this.resolveModule(
              submoduleDefinition,
              moduleDiContainer,
              diCache,
              moduleCache,
            ),
          );
        }
      }
      const moduleContainer = this.populateDiContainer(
        moduleMetadata,
        moduleDiContainer,
        subModules,
      );
      moduleContainer.registerType(
        moduleMetadata.type,
        moduleMetadata.type,
        moduleMetadata.params?.map((param) => ({ identifier: param })),
        {},
      );
      moduleContainer.registerFactory(ModuleRef, () => moduleRef);
      const moduleResolver = new DependencyResolver(moduleContainer, diCache);
      const instance = await moduleResolver.resolve(moduleMetadata.type);

      moduleRef = new ModuleRef(
        moduleMetadata,
        moduleDiContainer,
        diCache,
        instance,
        subModules,
      );
      moduleCache.set(moduleMetadata, moduleRef);
    }
    return moduleRef;
  }

  private static async resolveModule(
    moduleDefinition: ModuleClass | DynamicModule,
    diContainer: DiContainer,
    diCache: DiCache,
    moduleCache: Map<ExtendedModuleMetadata, ModuleRef> = new Map(),
  ) {
    let moduleMetadata: ExtendedModuleMetadata;
    if (isDynamicModule(moduleDefinition)) {
      const staticMetadata = ModuleCatalog.getMetadata(moduleDefinition.type);
      moduleMetadata = {
        ...staticMetadata,
        ...moduleDefinition,
        imports: [
          ...(staticMetadata.imports ?? []),
          ...(moduleDefinition.imports ?? []),
        ],
        providers: [
          ...(staticMetadata.providers ?? []),
          ...(moduleDefinition.providers ?? []),
        ],
        controllers: [
          ...(staticMetadata.controllers ?? []),
          ...(moduleDefinition.controllers ?? []),
        ],
        exports: [
          ...(staticMetadata.exports ?? []),
          ...(moduleDefinition.exports ?? []),
        ],
      };
    } else {
      moduleMetadata = ModuleCatalog.getMetadata(moduleDefinition);
    }
    return await this.createModuleRef(
      moduleMetadata,
      diContainer,
      diCache,
      moduleCache,
    );
  }

  private static populateDiContainer(
    metadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    importedModules: ModuleRef[],
  ) {
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (!isProvider(provider)) {
          diContainer.registerFromMetadata(
            provider,
            Reflect.getMetadata("design:paramtypes", provider),
            undefined,
            undefined,
          );
        } else if (isConstructorProvider(provider)) {
          diContainer.registerType(
            provider.provide,
            provider.provide,
            provider.deps?.map((dep) => ({ identifier: dep })),
            undefined,
            provider.scope,
          );
        } else if (isClassProvider(provider)) {
          diContainer.registerAlias(provider.useClass, provider.provide);
          diContainer.registerFromMetadata(
            provider.useClass,
            Reflect.getMetadata("design:paramtypes", provider),
            undefined,
            provider.scope,
          );
        } else if (isFactoryProvider(provider)) {
          diContainer.registerFactory(
            provider.provide,
            provider.useFactory,
            provider.deps,
            provider.scope,
          );
        } else if (isValueProvider(provider)) {
          diContainer.registerValue(
            provider.provide,
            provider.useValue,
            provider.scope,
          );
        }
      }
    }
    if (metadata.imports) {
      for (const moduleRef of importedModules) {
        if (
          !moduleRef?.metadata?.exports &&
          !moduleRef?.metadata?.controllers
        ) {
          continue;
        }
        for (
          const exportedIdentifier of [
            ...(moduleRef.metadata?.exports ?? []),
            ...(moduleRef.metadata?.controllers ?? []),
          ]
        ) {
          diContainer.import(exportedIdentifier, moduleRef.diContainer);
        }
      }
    }
    return diContainer;
  }
}
