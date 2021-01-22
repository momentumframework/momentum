import { MvModule } from "./deps.ts";
import { ViewService } from "./view.service.ts";

@MvModule({
  providers: [ViewService],
  exports: [ViewService],
})
export class MvcModule {}
