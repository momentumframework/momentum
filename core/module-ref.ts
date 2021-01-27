import {
  DependencyResolver,
  DependencyScope,
  DiContainer,
  Scope,
  ScopeCatalog,
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
    return [...this.#modules];
  }

  get controllers(): Type<unknown>[] {
    return [
      ...(this.#metadata.controllers ?? []),
      ...this.#modules.flatMap((module) => module.controllers ?? []),
    ];
  }

  resolve<T = unknown>(identifier: TypeIdentifier): Promise<T>;
  resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope: DependencyScope
  ): Promise<T>;
  async resolve<T = unknown>(
    identifier: TypeIdentifier,
    scope = DependencyScope.beginScope(Scope.Injection)
  ) {
    const resolver = new DependencyResolver(this.#diContainer, scope);
    return await resolver.resolve<T>(identifier);
  }

  public static async createModuleRef(
    parentContainer: DiContainer,
    metadata: ExtendedModuleMetadata,
    scopeCatalog: ScopeCatalog,
    dependencyScope: DependencyScope
  ): Promise<ModuleRef> {
    const diContainer = parentContainer.createChild(metadata.type.name);
    const subModules: ModuleRef[] = [];
    if (metadata.imports) {
      for (const moduleDefinition of metadata.imports) {
        subModules.push(
          await this.resolveModule(
            moduleDefinition,
            diContainer,
            dependencyScope,
            scopeCatalog
          )
        );
      }
    }
    const moduleContainer = this.populateDiContainer(
      diContainer,
      metadata,
      subModules,
      scopeCatalog
    );
    moduleContainer.registerType(
      metadata.type,
      metadata.type,
      metadata.params?.map((param) => ({ identifier: param })),
      {}
    );
    let moduleRef: ModuleRef | undefined = undefined;
    moduleContainer.registerFactory(ModuleRef, () => moduleRef);
    const moduleResolver = new DependencyResolver(
      moduleContainer,
      dependencyScope
    );
    const instance = await moduleResolver.resolve(metadata.type);

    moduleRef = new ModuleRef(metadata, moduleContainer, instance, subModules);
    return moduleRef;
  }

  private static async resolveModule(
    moduleDefinition: ModuleClass | DynamicModule,
    moduleContainer: DiContainer,
    moduleScope: DependencyScope,
    scopeCatalog: ScopeCatalog
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
      moduleContainer,
      moduleMetadata,
      scopeCatalog,
      moduleScope
    );
  }

  private static populateDiContainer(
    diContainer: DiContainer,
    metadata: ExtendedModuleMetadata,
    importedModules: ModuleRef[],
    scopeCatalog: ScopeCatalog
  ) {
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        if (!isProvider(provider)) {
          diContainer.registerFromMetadata(provider);
        } else if (isConstructorProvider(provider)) {
          diContainer.registerType(
            provider.provide,
            provider.provide,
            provider.deps?.map((dep) => ({ identifier: dep }))
          );
          if (provider.scope === Scope.Custom) {
            scopeCatalog.registerScopeIdentifier(
              (provider as { scopeIdentifier: unknown })
                .scopeIdentifier as TypeIdentifier,
              provider.provide
            );
          } else if (provider.scope) {
            scopeCatalog.registerScopeIdentifier(
              provider.provide,
              provider.scope
            );
          }
        } else if (isClassProvider(provider)) {
          diContainer.registerAlias(provider.useClass, provider.provide);
          diContainer.registerFromMetadata(provider.useClass);
          if (provider.scope === Scope.Custom) {
            scopeCatalog.registerScopeIdentifier(
              (provider as { scopeIdentifier: unknown })
                .scopeIdentifier as TypeIdentifier,
              provider.provide
            );
          } else if (provider.scope) {
            scopeCatalog.registerScopeIdentifier(
              provider.provide,
              provider.scope
            );
          }
        } else if (isFactoryProvider(provider)) {
          diContainer.registerFactory(
            provider.provide,
            provider.useFactory,
            provider.deps
          );
          if (provider.scope === Scope.Custom) {
            scopeCatalog.registerScopeIdentifier(
              (provider as { scopeIdentifier: unknown })
                .scopeIdentifier as TypeIdentifier,
              provider.provide
            );
          } else if (provider.scope) {
            scopeCatalog.registerScopeIdentifier(
              provider.provide,
              provider.scope
            );
          }
        } else if (isValueProvider(provider)) {
          diContainer.registerValue(provider.provide, provider.useValue);
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
