import { MvModule } from "../../../../core/mod.ts";
import { GreetingController } from "./greeting.controller.ts";
import { GreetingService } from "./greeting.service.ts";

@MvModule({
  providers: [GreetingService],
  controllers: [GreetingController],
})
export class AppModule {}
