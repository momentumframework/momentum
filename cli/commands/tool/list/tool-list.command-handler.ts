import { Injectable } from "../../../deps.ts";
import { getMvInstallationPaths } from "../../../install/mod.ts";
import { CommandHandler } from "../../command-handler.interface.ts";
import { ToolConfig } from "../tool-config.interface.ts";
import { ToolManagerService } from "../tool-manager.service.ts";
import { ToolListCommandParameters } from "./tool-list.command-parameters.ts";

@Injectable({ global: false })
export class ToolListCommandHandler
  implements CommandHandler<ToolListCommandParameters> {
  constructor(
    private readonly toolManager: ToolManagerService,
  ) {
  }

  async handle(commandParameters: ToolListCommandParameters) {
    const tools = await this.toolManager.getToolConfigs();

    if (tools.length) {
      tools.forEach((tool) => {
        console.log(`${tool.name}\t|\t${tool.url}`);
      });
    } else {
      console.log("No tools installed!");
    }
  }
}
