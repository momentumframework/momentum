import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import { NewProjectCommandHandler } from "./new-project.command-handler.ts";
import { NewProjectCommandParameters } from "./new-project.command-parameters.ts";

@Injectable({ global: false })
export class NewProjectCommandController implements CommandController {
  constructor(
    private readonly commandHandler: NewProjectCommandHandler,
  ) {
  }

  createCommand(): Command {
    const command = new Command("new");
    command.arguments("<name>");
    command.option(
      "-r, --repository-url <repositoryUrl>",
      "full URL of the repository to clone",
    );
    command.action((name: string, repositoryUrl: string) => {
      const commandParameters = new NewProjectCommandParameters({
        name,
        repositoryUrl,
      });
      return this.commandHandler.handle(commandParameters);
    });
    return command;
  }
}
