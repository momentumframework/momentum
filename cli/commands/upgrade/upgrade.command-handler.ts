import { Injectable } from "../../deps.ts";
import { MvfManagerService } from "../../global/mod.ts";
import { CommandHandler } from "../command-handler.interface.ts";
import { UpgradeCommandParameters } from "./upgrade.command-parameters.ts";

@Injectable({ global: false })
export class UpgradeCommandHandler
  implements CommandHandler<UpgradeCommandParameters> {
  constructor(
    private readonly mvfManager: MvfManagerService,
  ) {
  }

  async handle(commandParameters: UpgradeCommandParameters) {
    await this.mvfManager.upgrade(commandParameters.version);
  }
}
