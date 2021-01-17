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
} from "./module-metadata.ts";

export class ModuleRef {
  #metadata: ExtendedModuleMetadata;
  #diContainer: DiContainer;
  #instance: unknown;

  constructor(
    metadata: ExtendedModuleMetadata,
    diContainer: DiContainer,
    instance: unknown
  ) {
    this.#metadata = metadata;
    this.#diContainer = diContainer;
    this.#instance = instance;
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

  resolve<T = unknown>(identifier: TypeIdentifier): T;
  resolve<T = unknown>(identifier: TypeIdentifier, scope: DependencyScope): T;
  resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope = DependencyScope.beginScope()
  ) {
    const resolver = new DependencyResolver(this.diContainer, scope);
    return resolver.resolve(identifier) as T;
  }

  public static createModuleRef(
    rootContainer: DiContainer,
    metadata: ExtendedModuleMetadata,
    scope: DependencyScope
  ): ModuleRef {
    const diContainer = ModuleRef.buildModuleDiContainer(
      rootContainer,
      metadata,
      (metadata.imports ?? []).map((importedModule) =>
        ModuleRef.createModuleRef(
          rootContainer,
          ModuleCatalog.getMetadata(importedModule),
          scope
        )
      )
    );
    diContainer.registerType(
      metadata.type,
      metadata.type,
      metadata.params?.map((param) => ({ identifier: param })),
      {}
    );
    const moduleResolver = new DependencyResolver(diContainer, scope);
    const instance = moduleResolver.resolve(metadata.type);
    return new ModuleRef(metadata, diContainer, instance);
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
          diContainer.registerAlias(provider.provide, provider.useClass);
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
