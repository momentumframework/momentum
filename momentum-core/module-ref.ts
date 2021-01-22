import {
  DependencyResolver,
  DependencyScope,
  DiContainer,
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
  readonly #instance: unknown;
  readonly #modules: ModuleRef[];

  constructor(
    metadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    instance: unknown,
    modules: ModuleRef[]
  ) {
    this.#metadata = metadata;
    this.#diContainer = diContainer;
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
    return this.#modules;
  }

  resolve<T = unknown>(identifier: TypeIdentifier): Promise<T>;
  resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope: DependencyScope
  ): Promise<T>;
  async resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope = DependencyScope.beginScope()
  ) {
    const resolver = new DependencyResolver(this.diContainer, scope);
    return (await resolver.resolve(identifier)) as T;
  }

  public static async createModuleRef(
    rootContainer: DiContainer,
    metadata: ExtendedModuleMetadata,
    scope: DependencyScope
  ): Promise<ModuleRef> {
    const modules = await Promise.all(
      (metadata.imports ?? []).map(
        async (moduleDef) =>
          await this.resolveModule(moduleDef, rootContainer, scope)
      )
    );
    const diContainer = this.buildModuleDiContainer(
      rootContainer,
      metadata,
      modules
    );
    diContainer.registerType(
      metadata.type,
      metadata.type,
      metadata.params?.map((param) => ({ identifier: param })),
      {}
    );
    const moduleResolver = new DependencyResolver(diContainer, scope);
    const instance = await moduleResolver.resolve(metadata.type);
    return new ModuleRef(metadata, diContainer, instance, modules);
  }

  private static async resolveModule(
    moduleDef: ModuleClass | DynamicModule,
    rootContainer: DiContainer,
    scope: DependencyScope
  ) {
    let moduleMetadata: ExtendedModuleMetadata;
    if (isDynamicModule(moduleDef)) {
      const staticMetadata = ModuleCatalog.getMetadata(moduleDef.type);
      moduleMetadata = {
        ...staticMetadata,
        ...moduleDef,
        imports: [
          ...(staticMetadata.imports ?? []),
          ...(moduleDef.imports ?? []),
        ],
        providers: [
          ...(staticMetadata.providers ?? []),
          ...(moduleDef.providers ?? []),
        ],
        controllers: [
          ...(staticMetadata.controllers ?? []),
          ...(moduleDef.controllers ?? []),
        ],
        exports: [
          ...(staticMetadata.exports ?? []),
          ...(moduleDef.exports ?? []),
        ],
      };
    } else {
      moduleMetadata = ModuleCatalog.getMetadata(moduleDef);
    }
    return await this.createModuleRef(rootContainer, moduleMetadata, scope);
  }

  private static buildModuleDiContainer(
    rootContainer: DiContainer,
    metadata: ExtendedModuleMetadata,
    importedModules: ModuleRef[]
  ) {
    const diContainer = rootContainer.createChild();
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (!isProvider(provider)) {
          diContainer.registerType(provider, provider);
        } else if (isConstructorProvider(provider)) {
          diContainer.registerType(
            provider.provide,
            provider.provide,
            provider.deps?.map((dep) => ({ identifier: dep }))
          );
        } else if (isClassProvider(provider)) {
          diContainer.registerAlias(provider.useClass, provider.provide);
        } else if (isFactoryProvider(provider)) {
          diContainer.registerFactory(
            provider.provide,
            provider.useFactory,
            provider.deps
          );
        } else if (isValueProvider(provider)) {
          diContainer.registerValue(provider.provide, provider.useValue);
        }
      }
    }
    if (metadata.imports) {
      for (const moduleRef of importedModules) {
        if (!moduleRef?.metadata.exports) {
          continue;
        }
        for (const exportedIdentifier of moduleRef.metadata.exports) {
          diContainer.import(exportedIdentifier, moduleRef.diContainer);
        }
      }
    }
    return diContainer;
  }
}
