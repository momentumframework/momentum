import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import { ToolInstallCommandHandler } from "./install/tool-install.command-handler.ts";
import { ToolInstallCommandParameters } from "./install/tool-install.command-parameters.ts";
import { ToolListCommandHandler } from "./list/tool-list.command-handler.ts";
import { ToolListCommandParameters } from "./list/tool-list.command-parameters.ts";
import { ToolUninstallCommandHandler } from "./uninstall/tool-uninstall.command-handler.ts";
import { ToolUninstallCommandParameters } from "./uninstall/tool-uninstall.command-parameters.ts";

@Injectable({ global: false })
export class ToolCommandController implements CommandController {
  constructor(
    private readonly installCommandHandler: ToolInstallCommandHandler,
    private readonly uninstallCommandHandler: ToolUninstallCommandHandler,
    private readonly listCommandHandler: ToolListCommandHandler,
  ) {
  }

  createCommand(): Command {
    const command = new Command("tool");
    command.description("Manages add-on tools.");
    command.alias("t");
    command.addCommand(this.createInstallCommand());
    command.addCommand(this.createUninstallCommand());
    command.addCommand(this.createListCommand());
    return command;
  }

  private createInstallCommand() {
    const command = new Command("install");
    command.description("Installs a new add-on tools.");
    command.alias("i");
    command.arguments("<toolUrl>");
    command.action((toolUrl: string) => {
      const commandParameters = new ToolInstallCommandParameters({
        toolUrl: toolUrl.trim(),
      });

      return this.installCommandHandler.handle(commandParameters);
    });
    return command;
  }

  private createUninstallCommand() {
    const command = new Command("uninstall");
    command.description("Uninstalls add-on tools.");
    command.alias("u");
    command.action((command: Command) => {
      const commandParameters = new ToolUninstallCommandParameters({
        names: command.args.map((a) => a?.toLocaleLowerCase()?.trim()).filter(
          (x) => !!x?.length,
        ),
      });

      return this.uninstallCommandHandler.handle(commandParameters);
    });
    return command;
  }

  private createListCommand() {
    const command = new Command("list");
    command.description("Lists installed add-on tools.");
    command.alias("ls");
    command.action((command: Command) => {
      const commandParameters = new ToolListCommandParameters();

      return this.listCommandHandler.handle(commandParameters);
    });
    return command;
  }
}
