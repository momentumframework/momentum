import { MvModule } from "../../core/mod.ts";
import { MvcModule } from "../../mvc/mod.ts";
import { MvcHandlebarsModule } from "../../mvc-handlebars/mod.ts";
import { StaticFileModule } from "../../static-files/mod.ts";

@MvModule({
  imports: [
    MvcModule.register({
      viewEngineModule: MvcHandlebarsModule,
    }),
    StaticFileModule,
  ],
})
export class AppModule {}
