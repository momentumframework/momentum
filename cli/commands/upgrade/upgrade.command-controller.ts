import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import { UpgradeCommandHandler } from "./upgrade.command-handler.ts";
import { UpgradeCommandParameters } from "./upgrade.command-parameters.ts";

@Injectable({ global: false })
export class UpgradeCommandController implements CommandController {
  constructor(
    private readonly commandHandler: UpgradeCommandHandler,
  ) {
  }

  createCommand(): Command {
    const command = new Command("upgrade");
    command.alias("u");
    command.description("Upgrades the mvf CLI.");
    command.arguments("[version]");
    command.option(
      "-r, --repository-url [repositoryUrl]",
      "full URL of the repository to clone",
    );
    command.action((providedVersion: string, command: Command) => {
      let version: string | null = null;

      if (providedVersion?.length) {
        const providedVersionParts = providedVersion.split(".").map((p) =>
          p.trim()
        );

        if (providedVersionParts.some((p) => isNaN(parseInt(p, 10)))) {
          throw new Error("Invalid version format. Expected format: 0.0.8");
        }

        version = providedVersionParts.join(".");
      }

      const commandParameters = new UpgradeCommandParameters({
        version,
      });

      console.log({ commandParameters });

      // return this.commandHandler.handle(commandParameters);
    });
    return command;
  }
}
