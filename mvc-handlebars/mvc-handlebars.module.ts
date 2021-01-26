import { MvModule, VIEW_ENGINE } from "./deps.ts";
import { HandlebarsViewEngine } from "./handlebars-view-engine.ts";

@MvModule({
  providers: [
    {
      provide: VIEW_ENGINE,
      useClass: HandlebarsViewEngine,
    },
  ],
  exports: [VIEW_ENGINE],
})
export class MvcHandlebarsModule {}
