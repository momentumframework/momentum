import { MVC_HANDLEBARS_CONFIG } from "./constants.ts";
import { DynamicModule, MvModule, VIEW_ENGINE } from "./deps.ts";
import { HandlebarsViewEngine } from "./handlebars-view-engine.ts";
import { MvcHandlebarsConfig } from "./mvc-handlebars-config.ts";

@MvModule({
  providers: [
    {
      provide: VIEW_ENGINE,
      useClass: HandlebarsViewEngine,
    },
  ],
  exports: [VIEW_ENGINE],
})
export class MvcHandlebarsModule {
  static register(config: MvcHandlebarsConfig): DynamicModule {
    return {
      type: MvcHandlebarsModule,
      providers: [
        {
          provide: MVC_HANDLEBARS_CONFIG,
          useValue: config,
        },
      ],
    };
  }
}
