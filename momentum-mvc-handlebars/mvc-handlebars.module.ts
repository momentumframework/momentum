import { CONFIG } from "./constants.ts";
import {
  DynamicModule,
  FactoryProvider,
  HandlebarsConfig,
  ModuleMetadata,
  MvModule,
  ViewService,
  VIEW_ENGINE,
} from "./deps.ts";
import { HandlebarsViewEngine } from "./handlebars-view-engine.ts";

@MvModule({
  providers: [
    ViewService,
    {
      provide: VIEW_ENGINE,
      useClass: HandlebarsViewEngine,
    },
  ],
  exports: [ViewService],
})
export class MvcHandlebarsModule {
  static register(config?: HandlebarsConfig): DynamicModule {
    return {
      type: MvcHandlebarsModule,
      providers: [
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    };
  }
  static registerAsync(
    config: Omit<
      FactoryProvider<HandlebarsConfig | Promise<HandlebarsConfig>>,
      "provide"
    > &
      Pick<ModuleMetadata, "imports">
  ): DynamicModule {
    return {
      type: MvcHandlebarsModule,
      imports: [...(config.imports ?? [])],
      providers: [
        {
          provide: CONFIG,
          useFactory: config.useFactory,
          deps: config.deps,
        },
      ],
    };
  }
}
