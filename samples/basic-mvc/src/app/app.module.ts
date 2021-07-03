import { MvModule } from "../../../../core/mod.ts";
import { MvcModule } from "../../../../mvc/mvc.module.ts";
import { MvcHandlebarsModule } from "../../../../mvc-handlebars/mod.ts";
import { StaticFileModule } from "../../../../static-files/mod.ts";
import { GreetingService } from "./greeting.service.ts";
import { HomeController } from "./home.controller.ts";

@MvModule({
  imports: [
    MvcModule.register({
      viewEngineModule: MvcHandlebarsModule,
    }),
    StaticFileModule,
  ],
  providers: [GreetingService],
  controllers: [HomeController],
})
export class AppModule {}
