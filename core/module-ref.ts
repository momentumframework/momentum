import {
  DependencyResolver,
  DiCache,
  DiContainer,
  Scope,
  Type,
  TypeIdentifier,
} from "./deps.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import {
  isClassProvider,
  isConstructorProvider,
  isFactoryProvider,
  isProvider,
  isValueProvider,
  ExtendedModuleMetadata,
  ModuleClass,
  DynamicModule,
} from "./module-metadata.ts";

function isDynamicModule(
  module: ModuleClass | DynamicModule
): module is DynamicModule {
  return typeof module !== "function";
}

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
    modules: ModuleRef[]
  ) {
    this.#metadata = metadata;
    this.#diContainer = diContainer;
    this.#diCache = diCache;
    this.#instance = instance;
    this.#modules = modules;
  }

  get metadata() {
    return Object.freeze({ ...this.#metadata });
  }

  get diContainer() {
    return this.#diContainer;
  }

  get instance() {
    return this.#instance;
  }

  get modules() {
    return [...this.#modules];
  }

  get controllers(): Type<unknown>[] {
    return [
      ...(this.#metadata.controllers ?? []),
      ...this.#modules.flatMap((module) => module.controllers ?? []),
    ];
  }

  resolve<T = unknown>(identifier: TypeIdentifier): Promise<T>;
  resolve<T = unknown>(identifier: TypeIdentifier, cache: DiCache): Promise<T>;
  async resolve<T = unknown>(
    identifier: TypeIdentifier,
    cache = this.#diCache
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
    diCache: DiCache
  ): Promise<ModuleRef> {
    const moduleDiContainer = diContainer.createChild(moduleMetadata.type.name);
    const subModules: ModuleRef[] = [];
    if (moduleMetadata.imports) {
      for (const submoduleDefinition of moduleMetadata.imports) {
        subModules.push(
          await this.resolveModule(
            submoduleDefinition,
            moduleDiContainer,
            diCache
          )
        );
      }
    }
    const moduleContainer = this.populateDiContainer(
      moduleMetadata,
      moduleDiContainer,
      subModules
    );
    moduleContainer.registerType(
      moduleMetadata.type,
      moduleMetadata.type,
      moduleMetadata.params?.map((param) => ({ identifier: param })),
      {}
    );
    let moduleRef: ModuleRef | undefined = undefined;
    moduleContainer.registerFactory(ModuleRef, () => moduleRef);
    const moduleResolver = new DependencyResolver(moduleContainer, diCache);
    const instance = await moduleResolver.resolve(moduleMetadata.type);

    moduleRef = new ModuleRef(
      moduleMetadata,
      moduleDiContainer,
      diCache,
      instance,
      subModules
    );
    return moduleRef;
  }

  private static async resolveModule(
    moduleDefinition: ModuleClass | DynamicModule,
    diContainer: DiContainer,
    diCache: DiCache
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
    return await this.createModuleRef(moduleMetadata, diContainer, diCache);
  }

  private static populateDiContainer(
    metadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    importedModules: ModuleRef[]
  ) {
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (!isProvider(provider)) {
          diContainer.registerFromMetadata(provider);
        } else if (isConstructorProvider(provider)) {
          diContainer.registerType(
            provider.provide,
            provider.provide,
            provider.deps?.map((dep) => ({ identifier: dep })),
            undefined,
            provider.scope
          );
        } else if (isClassProvider(provider)) {
          diContainer.registerAlias(provider.useClass, provider.provide);
          diContainer.registerFromMetadata(
            provider.useClass,
            undefined,
            provider.scope
          );
        } else if (isFactoryProvider(provider)) {
          diContainer.registerFactory(
            provider.provide,
            provider.useFactory,
            provider.deps,
            provider.scope
          );
        } else if (isValueProvider(provider)) {
          diContainer.registerValue(
            provider.provide,
            provider.useValue,
            provider.scope
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
        for (const exportedIdentifier of [
          ...(moduleRef.metadata?.exports ?? []),
          ...(moduleRef.metadata?.controllers ?? []),
        ]) {
          diContainer.import(exportedIdentifier, moduleRef.diContainer);
        }
      }
    }
    return diContainer;
  }
}
