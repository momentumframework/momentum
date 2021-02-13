import { Injectable } from "../../../deps.ts";
import { CommandHandler } from "../../command-handler.interface.ts";
import { ToolManagerService } from "../tool-manager.service.ts";
import { ToolUninstallCommandParameters } from "./tool-uninstall.command-parameters.ts";

@Injectable({ global: false })
export class ToolUninstallCommandHandler
  implements CommandHandler<ToolUninstallCommandParameters> {
  constructor(
    private readonly toolManager: ToolManagerService,
  ) {
  }

  async handle(commandParameters: ToolUninstallCommandParameters) {
    await this.toolManager.uninstallTools(commandParameters.names);
  }
}
