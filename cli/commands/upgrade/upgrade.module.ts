import { MvModule } from "../../deps.ts";
import { UpgradeCommandController } from "./upgrade.command-controller.ts";
import { UpgradeCommandHandler } from "./upgrade.command-handler.ts";

@MvModule({
  providers: [
    UpgradeCommandController,
    UpgradeCommandHandler,
  ],
  exports: [
    UpgradeCommandController,
  ],
})
export class UpgradeCommandModule {}
