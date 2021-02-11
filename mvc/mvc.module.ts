import {
  DynamicModule,
  FactoryFunction,
  FactoryProvider,
  Inject,
  ModuleClass,
  ModuleMetadata,
  MvModule,
  PLATFORM,
  ServerPlatform,
} from "./deps.ts";
import { MVC_CONFIG } from "./mod.ts";
import { MvcConfig } from "./mvc-config.ts";
import { MvcFilter } from "./mvc-filter.ts";
import { ViewService } from "./view.service.ts";

interface MvcModuleOptions {
  /**
   * Module which will provide the view engine
   * 
   * @remarks
   * No default view engine is provided, so a view engine module must be supplied in order to render views. 
   */
  viewEngineModule: ModuleClass | DynamicModule;
  config?: Partial<MvcConfig>;
}

/**
 * Include this module in your application to enable MVC (model-view-controller)
 */
@MvModule({
  providers: [MvcFilter, ViewService],
  exports: [ViewService],
})
export class MvcModule {
  static register(options: MvcModuleOptions): DynamicModule {
    return {
      type: MvcModule,
      imports: [options.viewEngineModule],
      providers: [
        {
          provide: MVC_CONFIG,
          useValue: options.config,
        },
      ],
    };
  }
  static registerAsync(
    options:
      & {
        configFactory: FactoryFunction<
          Partial<MvcConfig> | Promise<Partial<MvcConfig>>
        >;
      }
      & Pick<FactoryProvider, "deps">
      & Pick<ModuleMetadata, "imports">
      & Pick<MvcModuleOptions, "viewEngineModule">,
  ): DynamicModule {
    return {
      type: MvcModule,
      imports: [options.viewEngineModule, ...(options.imports ?? [])],
      providers: [
        {
          provide: MVC_CONFIG,
          useFactory: options.configFactory,
          deps: options.deps,
        },
      ],
    };
  }
  constructor(
    @Inject(PLATFORM) platform: ServerPlatform,
    mvcFilter: MvcFilter,
  ) {
    platform.registerGlobalFilter(mvcFilter);
  }
}
