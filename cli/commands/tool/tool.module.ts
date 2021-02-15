import { ToolManagerService } from "./tool-manager.service.ts";
import { MvModule } from "../../deps.ts";
import { ToolCommandController } from "./tool.command-controller.ts";
import { ToolInstallCommandHandler } from "./install/tool-install.command-handler.ts";
import { ToolUninstallCommandHandler } from "./uninstall/tool-uninstall.command-handler.ts";
import { ToolListCommandHandler } from "./list/tool-list.command-handler.ts";

@MvModule({
  providers: [
    ToolManagerService,
    ToolCommandController,
    ToolInstallCommandHandler,
    ToolUninstallCommandHandler,
    ToolListCommandHandler,
  ],
  exports: [
    ToolCommandController,
    ToolManagerService,
  ],
})
export class ToolCommandModule {}
