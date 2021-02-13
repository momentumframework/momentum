import { Injectable } from "../../../deps.ts";
import { CommandHandler } from "../../command-handler.interface.ts";
import { ToolManagerService } from "../tool-manager.service.ts";
import { ToolInstallCommandParameters } from "./tool-install.command-parameters.ts";

@Injectable({ global: false })
export class ToolInstallCommandHandler
  implements CommandHandler<ToolInstallCommandParameters> {
  constructor(
    private readonly toolManager: ToolManagerService,
  ) {
  }

  async handle(commandParameters: ToolInstallCommandParameters) {
    const tool = await this.toolManager.parseToolModule(
      commandParameters.toolUrl,
    );

    const name = tool.getName()?.trim()?.toLocaleLowerCase();
    if (!name?.length) {
      throw new Error(
        `Invalid name detected in module: ${commandParameters.toolUrl}`,
      );
    }

    await this.toolManager.installTools([{
      name,
      url: commandParameters.toolUrl,
    }]);
  }
}
